import { datatype, Oxssy, OxssyMap } from 'oxssy';
import * as oxssyRouter from 'oxssy-router';
import OxssyRequest from '../src';


describe('OxssyRequest client', () => {
  const email = new Oxssy(datatype.string.isRequired.withOption({ isEmail: true }));
  const password = new Oxssy(datatype.string.isRequired.withOption({ longerThanEqual: 8 }));
  const form = new OxssyMap({ email, password });

  const username = new Oxssy(datatype.string.isRequired);
  const userText = new Oxssy(datatype.string);
  const userDisplay = new OxssyMap({ username, userText });

  const remock = (redirect = null) => {
    oxssyRouter.setLocation = jest.fn();
    fetch.resetMocks();
    fetch.mockResponse(JSON.stringify({
      redirect,
      update: {
        username: 'Tiger',
        userText: 'Oxssy is sexy',
      },
    }));
  };

  test('OxssyRequest gets', async () => {
    remock();
    const isLoading = new Oxssy(datatype.bool.isRequired, false);
    const requestError = new Oxssy(datatype.string);
    const getRequest = new OxssyRequest(
      '/get',
      null,
      userDisplay,
      { loadingOxssy: isLoading, requestErrorOxssy: requestError },
    );
    return getRequest.send().then(() => {
      expect(isLoading.value).toBeFalsy();
      expect(requestError.value).toBeNull();
      expect(fetch.mock.calls.length).toBe(1);
      expect(fetch.mock.calls[0][0]).toBe('/get');
      expect(username.value).toBe('Tiger');
      expect(userText.value).toBe('Oxssy is sexy');
    });
  });

  test('OxssyRequest validates before it posts', () => {
    remock();
    const isLoading = new Oxssy(datatype.bool.isRequired, false);
    const requestError = new Oxssy(datatype.string);
    const postRequest = new OxssyRequest(
      '/postForm',
      form,
      userDisplay,
      { loadingOxssy: isLoading, requestErrorOxssy: requestError },
    );
    return form.update({ email: 'notAnEmail.com', password: '2short' })
      .then(() => postRequest.send())
      .then(() => {
        expect(isLoading.value).toBeFalsy();
        expect(requestError.value).toBeNull();
        expect(email.validation).toBe('EMAIL_EXPECTED');
        expect(password.validation).toBe('TOO_SHORT');
        expect(fetch.mock.calls.length).toBe(0);
      });
  });

  test('OxssyRequest posts', () => {
    remock();
    const isLoading = new Oxssy(datatype.bool.isRequired, false);
    const requestError = new Oxssy(datatype.string);
    const postRequest = new OxssyRequest(
      '/postForm',
      form,
      userDisplay,
      { loadingOxssy: isLoading, requestErrorOxssy: requestError },
    );
    return form.update({ email: 'tiger@oxssy.com', password: 'G00dP@ssw0rd' })
      .then(() => postRequest.send())
      .then(() => {
        expect(isLoading.value).toBeFalsy();
        expect(requestError.value).toBeNull();
        expect(email.validation).toBeNull();
        expect(password.validation).toBeNull();
        expect(fetch.mock.calls.length).toBe(1);
        expect(fetch.mock.calls[0][0]).toBe('/postForm');
        expect(username.value).toBe('Tiger');
        expect(userText.value).toBe('Oxssy is sexy');
      });
  });

  test('OxssyRequest redirects', () => {
    remock({ pathname: '/redirected' });
    const isLoading = new Oxssy(datatype.bool.isRequired, false);
    const requestError = new Oxssy(datatype.string);
    const postRequest = new OxssyRequest(
      '/getRedirect?oxssy=sexy',
      null,
      null,
      { loadingOxssy: isLoading, requestErrorOxssy: requestError },
    );
    return postRequest.send()
      .then(() => {
        expect(isLoading.value).toBeFalsy();
        expect(requestError.value).toBeNull();
        expect(fetch.mock.calls.length).toBe(1);
        expect(fetch.mock.calls[0][0]).toBe('/getRedirect?oxssy=sexy');
        expect(oxssyRouter.setLocation.mock.calls.length).toBe(1);
        expect(oxssyRouter.setLocation.mock.calls[0][0]).toBe('/redirected');
      });
  });
});
