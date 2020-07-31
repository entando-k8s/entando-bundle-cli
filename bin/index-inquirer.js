const inquirer = require('inquirer');
const axios = require('axios');
const fs = require('fs');

var allAnswers = {};
var componentCache = {};

const envFile = process.argv[2];
const envContent = JSON.parse(fs.readFileSync(envFile));

const { coreBaseApi, clientId, clientSecret, tokenUrl } = envContent;

const apiUrlTable = {
  widget: `${coreBaseApi}/widgets`,
  pageTemplate: `${coreBaseApi}/pageModels`,
  fragment: `${coreBaseApi}/fragments`,
  contentType: `${coreBaseApi}/plugins/cms/contentTypes`,
  contentTemplate: `${coreBaseApi}/plugins/cms/contentmodels`,
};

const componentDetailExtractors = {
  widget: (components) =>
    components.map((c) => {
      return { value: c.code, name: `${c.titles.en} (${c.code})` };
    }),
  pageTemplate: (components) =>
    components.map((c) => {
      return { value: c.code, name: `${c.descr} (${c.code})` };
    }),
  fragment: (components) =>
    components.map((c) => {
      return { value: c.code, name: c.code };
    }),
  contentType: (components) =>
    components.map((c) => {
      return { value: c.code, name: `${c.name} (${c.code})` };
    }),
  contentTemplate: (components) =>
    components.map((c) => {
      return { value: c.id, name: `${c.descr} (${c.id})` };
    }),
};

const urlEncoder = function (payload) {
  return Object.keys(payload)
    .map((k) => `${k}=${payload[k]}`)
    .reduce((a, v, i) => (i === 0 ? v : `${a}&${v}`), '');
};

const getToken = async function () {
  const payload = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  };

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const res = await axios.post(tokenUrl, urlEncoder(payload), headers);
  return res.data.access_token;
};

const getComponents = async function (type) {
  const token = await getToken();
  const res = await axios.get(apiUrlTable[type], {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data.payload;
};

const hasProperty = function (obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

const questions = [
  {
    type: 'confirm',
    name: 'addComponents',
    message: 'Do you want to add new components to the bundle?',
    default: true,
  },
  {
    when: (answers) => answers.addComponents === true,
    type: 'list',
    name: 'componentType',
    message: 'Which type of components you want to add to the bundle?',
    choices: [
      { name: 'Microfrontends / Widgets', value: 'widget' },
      { name: 'Page templates', value: 'pageTemplate' },
      { name: 'UX Fragments', value: 'fragment' },
      // {name:'Microservices', value: 'microservice'},
      { name: 'Content Templates', value: 'contentTemplate' },
      { name: 'Content Types', value: 'contentType' },
    ],
  },
  {
    when: (answers) =>
      answers.addComponents === true && answers.componentType !== null,
    type: 'checkbox',
    name: 'components',
    message: 'Which widgets do you want to include in the bundle?',
    choices: async (answers) => {
      const ct = answers.componentType;
      if (!hasProperty(componentCache, ct)) {
        const components = await getComponents(answers.componentType);
        componentCache[ct] = components;
      }
      return componentDetailExtractors[ct](componentCache[ct]);
    },
    default: async (answers) => {
      if (hasProperty(allAnswers, answers.componentType)) {
        return Array.from(allAnswers[answers.componentType]);
      }
      return {};
    },
  },
];

async function main () {
  try {
    let answers = await inquirer.prompt(questions);
    while (answers.addComponents) {
      const ct = answers.componentType;
      const comps = answers.components;
      if (!hasProperty(allAnswers, ct)) {
        allAnswers[ct] = new Set();
      }
      comps.forEach((c) => allAnswers[ct].add(c));
      answers = await inquirer.prompt(questions);
    }
    console.log(allAnswers);
    console.log('Goodbye');
  } catch (error) {
    if (error.isTtyError) {
      console.log("Prompt couldn't be rendered in the current environment");
    } else {
      console.log(error);
    }
    process.exit(1);
  }
}

main();