import { Oxssy, OxssyArray, OxssyMap } from 'oxssy';


const validate = (oxssy, value) => {
  if (oxssy instanceof Oxssy) {
    const error = oxssy.type(value);
    if (error) {
      throw new Error(`Value ${value} is invalid with error ${error}`);
    }
  } else if (oxssy instanceof OxssyArray) {
    const children = oxssy.children();
    if (!Array.isArray(value) || value.length !== children.length) {
      throw new Error(`Expecting array of length ${children.length}, got ${value} instead`);
    }
    children.forEach((child, index) => validate(child, value[index]));
  } else if (oxssy instanceof OxssyMap) {
    if (!value) {
      throw new Error(`Unexpected value ${value}`);
    }
    const allowedKeys = Object.keys(oxssy.oxssyMap);
    Object.keys(value).forEach((key) => {
      if (!allowedKeys.includes(key)) {
        throw new Error(`Unexpected value ${value} with key ${key}`);
      }
    });
    Object.entries(oxssy.oxssyMap).forEach(([key, entry]) => validate(entry, value[key]));
  } else {
    throw new Error(`Cannot validate against ${oxssy}`);
  }
};
export default validate;