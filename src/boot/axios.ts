import axios from 'axios';

// Configure axios met de productie URL
const getApiUrl = (): string => {
  // Gebruik altijd de productie URL
  return 'https://pb.pitch-putt.live';
};

const api = axios.create({
  baseURL: getApiUrl(),
});

export { api };

export default ({ app }) => {
  // Add axios to Vue instance
  app.config.globalProperties.$axios = api;
};
