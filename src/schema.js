export default {
  type: 'schema',
  types: [
    {
      type: 'document',
      key: 'Person',
      title: 'Person',
      fields: [
        {
          type: 'string',
          key: 'name',
          title: 'Name'
        }
      ]
    },
    {
      type: 'document',
      key: 'Movie',
      title: 'Movie',
      fields: [
        {
          type: 'string',
          key: 'title',
          title: 'Title'
        },
        {
          type: 'number',
          key: 'year',
          title: 'Year'
        },
        {
          type: 'reference',
          key: 'director',
          to: [{type: 'person'}]
        }
      ]
    }
  ]
}
