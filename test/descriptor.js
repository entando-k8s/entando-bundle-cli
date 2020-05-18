module.exports = {
  code: 'pda-ecr-bundle',
  components: {
    fragments: [
      'fragments/keycloak.yaml',
      'fragments/css_hscf_areas_grid_layout.yaml',
      'fragments/css_hscf_content_grid_layouts.yaml',
    ],
    pageModels: [
      'page-templates/task_list_page_template.yaml',
      'page-templates/task_details_page_template.yaml',
      'page-templates/dashboard_page_template.yaml'],
    widgets: [
      'widgets/entando-brand-logo/widget-descriptor.yaml',
    ],
  },
  description: 'An example bundle for PDA related components (widgets, fragments, page templates and pages).',
};
