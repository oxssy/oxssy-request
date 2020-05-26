import httpMocks from 'node-mocks-http';
import { datatype, Oxssy } from 'oxssy';
import OxssyRequest, { handler } from '../src';

describe('handler', () => {
  const reqOx = new Oxssy(datatype.string.isRequired.withOption({ notEmpty: true }));
  const resOx = new Oxssy(datatype.string.isRequired.withOption({ isNumeric: true }));
  const testGet = new OxssyRequest('/get', null, resOx);
  const testPost = new OxssyRequest('/post', reqOx, resOx);

  test('get ok', () => {
    const oxHandler = handler(testGet, () => '1');
    const mockRequest = httpMocks.createRequest({
      method: 'GET',
      url: '/get',
    });
    const mockResponse = httpMocks.createResponse();
    oxHandler(mockRequest, mockResponse);
    expect(mockResponse._getData()).toBe('1');
  });

  test('post ok', () => {
    const oxHandler = handler(testPost, input => String(input.length));
    const mockRequest = httpMocks.createRequest({
      method: 'POST',
      url: '/post',
    });
    const mockResponse = httpMocks.createResponse();
    oxHandler(mockRequest, mockResponse);
    expect(mockResponse._getData()).toBe('4');
  });

  test('get with invalid response', () => {
    const oxHandler = handler(testGet, () => 'bad response');
    const mockRequest = httpMocks.createRequest({
      method: 'GET',
      url: '/get',
    });
    const mockResponse = httpMocks.createResponse();
    oxHandler(mockRequest, mockResponse);
    expect(mockResponse._getData()).toBe('1');
  });

  test('get with server exception', () => {
    const oxHandler = handler(testGet, () => { throw new Error('server exception'); });
    const mockRequest = httpMocks.createRequest({
      method: 'GET',
      url: '/get',
    });
    const mockResponse = httpMocks.createResponse();
    oxHandler(mockRequest, mockResponse);
    expect(mockResponse._getData()).toBe('1');
  });

  test('post with invalid request', () => {
    const oxHandler = handler(testPost, input => String(input.length));
    const mockRequest = httpMocks.createRequest({
      method: 'POST',
      url: '/post',
    });
    const mockResponse = httpMocks.createResponse();
    oxHandler(mockRequest, mockResponse);
    expect(mockResponse._getData()).toBe('4');
  });

  test('post with invalid response', () => {
    const oxHandler = handler(testPost, () => 'bad response');
    const mockRequest = httpMocks.createRequest({
      method: 'POST',
      url: '/post',
    });
    const mockResponse = httpMocks.createResponse();
    oxHandler(mockRequest, mockResponse);
    expect(mockResponse._getData()).toBe('4');
  });

  test('post with server exception', () => {
    const oxHandler = handler(testPost, () => { throw new Error('server exception'); });
    const mockRequest = httpMocks.createRequest({
      method: 'POST',
      url: '/post',
    });
    const mockResponse = httpMocks.createResponse();
    oxHandler(mockRequest, mockResponse);
    expect(mockResponse._getData()).toBe('4');
  });
});
