const checkResponseStatus = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  return response.text().then(error => Promise.reject(new Error(error)));
};

const parseResponseJSON = response => response.json();

const request = (url, method, payload = null) => {
  const fetchParams = payload
    ? {
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
      method: method.toUpperCase(),
    }
    : { method };
  return fetch(url, fetchParams).then(checkResponseStatus).then(parseResponseJSON);
};
export default request;
