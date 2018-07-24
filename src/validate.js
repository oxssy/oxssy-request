const stringifyError = error =>
  (typeof error === 'symbol' ? error.toString().slice(7, -1) : error);

const validate = (oxssy, value, strict = false, currentKey = null) => {
  if (Object.prototype.hasOwnProperty.call(oxssy, 'oxssyMap')) {
    if (!value) {
      throw new Error(`Unexpected value ${value}${currentKey ? ` at key ${currentKey}` : ''}`);
    }
    const allowedKeys = Object.keys(oxssy.oxssyMap);
    Object.keys(value).forEach((key) => {
      if (!allowedKeys.includes(key)) {
        throw new Error(`Unexpected key ${key} in value object ${value}${
          currentKey ? ` at key ${currentKey}` : ''
        }`);
      }
    });
    if (strict) {
      Object.entries(oxssy.oxssyMap).forEach(([key, child]) =>
        validate(child, value[key], true, `${currentKey ? `${currentKey}.` : ''}${key}`));
    } else {
      Object.entries(value).forEach(([key, child]) =>
        validate(oxssy.oxssyMap[key], child, false, `${currentKey ? `${currentKey}.` : ''}${key}`));
    }
  } else if (Object.prototype.hasOwnProperty.call(oxssy, 'oxssyArray')) {
    const children = oxssy.children();
    if (!Array.isArray(value) || value.length !== children.length) {
      throw new Error(`Expecting array of length ${children.length}, got ${value} instead${
        currentKey ? ` at key ${currentKey}` : ''
      }`);
    }
    children.forEach((child, index) => validate(child, value[index]));
  } else if (Object.prototype.hasOwnProperty.call(oxssy, 'oxssyType')) {
    const error = oxssy.oxssyType(value);
    if (error) {
      throw new Error(`Value ${value} is invalid with error ${stringifyError(error)}${
        currentKey ? ` at key ${currentKey}` : ''
      }`);
    }
  } else if (Array.isArray(oxssy)) {
    if (!Array.isArray(value) || value.length !== oxssy.length) {
      throw new Error(`Expecting array of length ${oxssy.length}, got ${value} instead${
        currentKey ? ` at key ${currentKey}` : ''
      }`);
    }
    oxssy.forEach((child, index) => validate(child, value[index]));
  } else if (typeof oxssy === 'object') {
    if (!value) {
      throw new Error(`Unexpected value ${value}${
        currentKey ? ` at key ${currentKey}` : ''
      }`);
    }
    const allowedKeys = Object.keys(oxssy);
    Object.keys(value).forEach((key) => {
      if (!allowedKeys.includes(key)) {
        throw new Error(`Unexpected key ${key} in value object ${value}${
          currentKey ? ` at key ${currentKey}` : ''
        }`);
      }
    });
    if (strict) {
      Object.entries(oxssy).forEach(([key, child]) => validate(child, value[key]));
    } else {
      Object.entries(value).forEach(([key, child]) => validate(oxssy[key], child));
    }
  } else {
    throw new Error(`Cannot validate against ${oxssy}`);
  }
};
export default validate;
