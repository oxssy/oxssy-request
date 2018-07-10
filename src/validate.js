const validate = (oxssy, value, strict = false) => {
  if (Object.prototype.hasOwnProperty.call(oxssy, 'oxssyMap')) {
    if (!value) {
      throw new Error(`Unexpected value ${value}`);
    }
    const allowedKeys = Object.keys(oxssy.oxssyMap);
    Object.keys(value).forEach((key) => {
      if (!allowedKeys.includes(key)) {
        throw new Error(`Unexpected key ${key}`);
      }
    });
    if (strict) {
      Object.entries(oxssy.oxssyMap).forEach(([key, child]) => validate(child, value[key]));
    } else {
      Object.entries(value).forEach(([key, child]) => validate(oxssy.oxssyMap[key], child));
    }
  } else if (Object.prototype.hasOwnProperty.call(oxssy, 'oxssyArray')) {
    const children = oxssy.children();
    if (!Array.isArray(value) || value.length !== children.length) {
      throw new Error(`Expecting array of length ${children.length}, got ${value} instead`);
    }
    children.forEach((child, index) => validate(child, value[index]));
  } else if (Object.prototype.hasOwnProperty.call(oxssy, 'oxssyType')) {
    const error = oxssy.oxssyType(value);
    if (error) {
      throw new Error(`Value ${value} is invalid with error ${error}`);
    }
  } else if (Array.isArray(oxssy)) {
    if (!Array.isArray(value) || value.length !== oxssy.length) {
      throw new Error(`Expecting array of length ${oxssy.length}, got ${value} instead`);
    }
    oxssy.forEach((child, index) => validate(child, value[index]));
  } else if (typeof oxssy === 'object') {
    if (!value) {
      throw new Error(`Unexpected value ${value}`);
    }
    const allowedKeys = Object.keys(oxssy);
    Object.keys(value).forEach((key) => {
      if (!allowedKeys.includes(key)) {
        throw new Error(`Unexpected key ${key}`);
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
