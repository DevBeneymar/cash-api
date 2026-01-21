// config/env.js - version simplifiée
const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  
  database: {
    url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/pcash'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_temporary',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_temporary'
  },
  api:{
    prefix:'/api/v1/'
  }
};


module.exports = config;