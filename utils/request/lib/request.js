'use strict';

const axios = require('axios');
const BASE_URL = 'http://localhost:7001';

const request = axios.create({
    baseURL: BASE_URL,
    timeout: 5000
})

request.interceptors.response.use(response => {
    if(response.status === 200) {
        return response.data;
    } else {
        return Promise.reject({message: `request error, status: ${response.status}; statusText: ${response.statusText}; data: ${response.data};`});
    }
}, err => {
    return Promise.reject(err);
})

module.exports = request;
