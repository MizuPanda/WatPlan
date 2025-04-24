import { parseRequirementsString } from '../src/utils/parse';

import examples from './cases.json';

describe('cases.json', ()=>{
    for(const [label, desc] of Object.entries(examples)){
      test(label, ()=>{
        const parsed = parseRequirementsString(desc);
        expect(parsed).toMatchSnapshot();
      });
    }
  });