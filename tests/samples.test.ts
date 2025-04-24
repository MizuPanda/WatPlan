import { parseRequirementsString } from '../src/utils/parse';
import examples from './samples.json';   // see below

describe('samples.json', ()=>{
  for(const [label, desc] of Object.entries(examples)){
    test(label, ()=>{
      const parsed = parseRequirementsString(desc);
      expect(parsed).toMatchSnapshot();
    });
  }
});

