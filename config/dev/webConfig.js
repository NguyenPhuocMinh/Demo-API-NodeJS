'use strict';

const webConfig = {
  permissions: [
    {
      id: '63398d4c-d0e9-4daf-9504-30d32810527e',
      name: 'resources.users.permissions.admin',
    },
    {
      id: '2c53695a-7401-4dc8-979b-e93a5f4e357d',
      name: 'resources.users.permissions.operator',
    },
    {
      id: '10bf9306-5a92-4acf-bf7b-4cdfd0d19a56',
      name: 'resources.users.permissions.user',
    },
  ],
  genders: [
    {
      id: '0',
      name: 'resources.users.genders.male',
    },
    {
      id: '1',
      name: 'resources.users.genders.female',
    },
    {
      id: '2',
      name: 'resources.users.genders.unknown',
    },
  ]
};

module.exports = webConfig;