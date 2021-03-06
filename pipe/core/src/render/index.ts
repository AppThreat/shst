import { ITypeDefMap, TTypeDef, IKindBox } from '~/types';
import renderEnum from './enum';
import renderInterface from './interface';
import renderImplementation from './struct/implementation';
import renderDeclaration from './struct/declaration';
import renderPrototypes from './struct/prototypes';
import renderFromJSON from './from-json';
import { typeWrap } from './helpers';

export default function render(types: ITypeDefMap): string[][] {
  return Object.entries(assemble(types));
}

export function assemble(types: ITypeDefMap): { [key: string]: string } {
  const boxed = kindBox(Object.values(types));

  return {
    'index.ts': `
      import * as classes from './struct';
      import * as types from './types';

      export default { classes, types };
      export * from './enum';
      export * from './interface';
      export * from './struct';
      export * from './from-json';
    `,
    'enum.ts': renderEnum(boxed.enum),
    'interface.ts': renderInterface(boxed.interface),
    'struct.js': renderImplementation(boxed.struct),
    'struct.d.ts': renderDeclaration(boxed.struct),
    'prototypes.ts': renderPrototypes(boxed.struct),
    'from-json.ts': renderFromJSON(boxed.struct),
    'types.ts': `
      export const interfaces: { [key: string]: { [key: string]: boolean} } = {
        ${boxed.interface
          .map((x) => {
            return `${x.is}: {
              ${x.implementedBy.map((y) => `${y}: true`).join(',\n')} 
            }`;
          })
          .join(',\n')}
      };
      export const traversal: { [key:string]: Array<{ is: string; list: boolean }> } = {
        ${boxed.struct
          .map((item) => {
            return `${item.is}: ${JSON.stringify(
              item.fields
                .filter((x) => typeWrap(x.value))
                .map((x) => ({ is: x.is, list: x.value.list }))
            )}`;
          })
          .join(',\n')}
      };
    `
  };
}

export function kindBox(arr: TTypeDef[]): IKindBox {
  return arr.reduce(
    (acc: IKindBox, item) => {
      switch (item.kind) {
        case 'enum':
          acc.enum.push(item);
          break;
        case 'interface':
          acc.interface.push(item);
          break;
        case 'struct':
          acc.struct.push(item);
          break;
        default:
          // eslint-disable-next-line no-console
          console.error(item);
          throw Error('Kind could not be identified');
      }
      return acc;
    },
    { enum: [], interface: [], struct: [] }
  );
}
