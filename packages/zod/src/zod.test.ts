import { describe, expect, it } from 'vitest';
import {
  generateZod,
  generateZodValidationSchemaDefinition,
  parseZodValidationSchemaDefinition,
  type ZodValidationSchemaDefinition,
} from '.';
import { SchemaObject } from 'openapi3-ts/oas30';
import { SchemaObject as SchemaObject31 } from 'openapi3-ts/oas31';

import { ContextSpecs, createLogger } from '@orval/core';
import * as fs from 'node:fs';

const queryParams: ZodValidationSchemaDefinition = {
  functions: [
    [
      'object',
      {
        // limit = non-required integer schema (coerce-able)
        limit: {
          functions: [
            ['number', undefined],
            ['optional', undefined],
            ['null', undefined],
          ],
          consts: [],
        },

        // q = non-required string array schema (not coerce-able)
        q: {
          functions: [
            [
              'array',
              {
                functions: [['string', undefined]],
                consts: [],
              },
            ],
            ['optional', undefined],
          ],
          consts: [],
        },
      },
    ],
  ],
  consts: [],
};

const record: ZodValidationSchemaDefinition = {
  functions: [
    [
      'object',
      {
        queryParams: {
          functions: [
            [
              'additionalProperties',
              {
                functions: [['any', undefined]],
                consts: [],
              },
            ],
          ],
          consts: [],
        },
      },
    ],
  ],
  consts: [],
};

describe('parseZodValidationSchemaDefinition', () => {
  describe('with `override.coerceTypes = false` (default)', () => {
    it('does not emit coerced zod property schemas', () => {
      const parseResult = parseZodValidationSchemaDefinition(
        queryParams,
        {
          output: {
            override: {
              useDates: false,
            },
          },
        } as ContextSpecs,
        false,
      );

      expect(parseResult.zod).toBe(
        'zod.object({\n  "limit": zod.number().optional().null(),\n  "q": zod.array(zod.string()).optional()\n})',
      );
    });
  });

  describe('with `override.coerceTypes = true`', () => {
    it('emits coerced zod property schemas', () => {
      const parseResult = parseZodValidationSchemaDefinition(
        queryParams,
        {
          output: {
            override: {
              useDates: false,
            },
          },
        } as ContextSpecs,
        true,
      );

      expect(parseResult.zod).toBe(
        'zod.object({\n  "limit": zod.coerce.number().optional().null(),\n  "q": zod.array(zod.coerce.string()).optional()\n})',
      );
    });
  });

  it('treats additionalProperties properly', () => {
    const parseResult = parseZodValidationSchemaDefinition(
      record,
      {
        output: {
          override: {
            useDates: false,
          },
        },
      } as ContextSpecs,
      false,
    );

    expect(parseResult.zod).toBe(
      'zod.object({\n  "queryParams": zod.record(zod.string(), zod.any())\n})',
    );
  });
});

const objectIntoObjectSchema: SchemaObject = {
  type: 'object',
  properties: {
    pet: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        tag: {
          type: 'string',
        },
      },
    },
  },
};

const deepRequiredSchema: SchemaObject = {
  type: 'object',
  properties: {
    pet: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
        },
        tag: {
          type: 'string',
        },
      },
    },
  },
};

const additionalPropertiesSchema: SchemaObject = {
  type: 'object',
  properties: {
    any: {
      type: 'object',
      additionalProperties: {},
    },
    true: {
      type: 'object',
      additionalProperties: true,
    },
  },
};

describe('generateZodValidationSchemaDefinition`', () => {
  it('required', () => {
    const result = generateZodValidationSchemaDefinition(
      deepRequiredSchema,
      {
        output: {
          override: {
            useDates: false,
          },
        },
      } as ContextSpecs,
      'strict',
      true,
      {
        required: true,
      },
    );

    expect(result).toEqual({
      functions: [
        [
          'object',
          {
            pet: {
              functions: [
                [
                  'object',
                  {
                    name: {
                      functions: [['string', undefined]],
                      consts: [],
                    },
                    tag: {
                      functions: [
                        ['string', undefined],
                        ['optional', undefined],
                      ],
                      consts: [],
                    },
                  },
                ],
                ['strict', undefined],
                ['optional', undefined],
              ],
              consts: [],
            },
          },
        ],
        ['strict', undefined],
      ],
      consts: [],
    });
  });

  it('generates a strict zod schema', () => {
    const result = generateZodValidationSchemaDefinition(
      objectIntoObjectSchema,
      {
        output: {
          override: {
            useDates: false,
          },
        },
      } as ContextSpecs,
      'strict',
      true,
      {
        required: true,
      },
    );

    expect(result).toEqual({
      functions: [
        [
          'object',
          {
            pet: {
              functions: [
                [
                  'object',
                  {
                    name: {
                      functions: [
                        ['string', undefined],
                        ['optional', undefined],
                      ],
                      consts: [],
                    },
                    tag: {
                      functions: [
                        ['string', undefined],
                        ['optional', undefined],
                      ],
                      consts: [],
                    },
                  },
                ],
                ['strict', undefined],
                ['optional', undefined],
              ],
              consts: [],
            },
          },
        ],
        ['strict', undefined],
      ],
      consts: [],
    });
  });

  it('additionalProperties', () => {
    const result = generateZodValidationSchemaDefinition(
      additionalPropertiesSchema,
      {
        output: {
          override: {
            useDates: false,
          },
        },
      } as ContextSpecs,
      'strict',
      true,
      {
        required: true,
      },
    );

    expect(result).toEqual({
      functions: [
        [
          'object',
          {
            any: {
              functions: [
                [
                  'additionalProperties',
                  {
                    functions: [['any', undefined]],
                    consts: [],
                  },
                ],
                ['optional', undefined],
              ],
              consts: [],
            },
            true: {
              functions: [
                [
                  'additionalProperties',
                  {
                    functions: [['any', undefined]],
                    consts: [],
                  },
                ],
                ['optional', undefined],
              ],
              consts: [],
            },
          },
        ],
        ['strict', undefined],
      ],
      consts: [],
    });
  });
});

const basicApiSchema = {
  pathRoute: '/cats',
  context: {
    specKey: 'cat',
    specs: {
      cat: {
        paths: {
          '/cats': {
            post: {
              operationId: 'xyz',
              parameters: [
                {
                  name: 'id',
                  required: true,
                  in: 'path',
                  schema: {
                    type: 'string',
                  },
                },
                {
                  name: 'page',
                  required: false,
                  in: 'query',
                  schema: {
                    type: 'number',
                  },
                },
                {
                  name: 'x-header',
                  in: 'header',
                  required: true,
                  schema: {
                    type: 'string',
                  },
                },
              ],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    output: {
      override: {
        zod: {
          generateEachHttpStatus: false,
        },
      },
    },
  },
};
describe('generatePartOfSchemaGenerateZod', () => {
  it('Default Config', async () => {
    const result = await generateZod(
      {
        pathRoute: '/cats',
        verb: 'post',
        operationName: 'test',
        override: {
          zod: {
            strict: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: false,
            },
            generate: {
              param: true,
              body: true,
              response: true,
              query: true,
              header: true,
            },
            coerce: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: false,
            },
          },
        },
      },
      basicApiSchema,
      {},
    );

    expect(result.implementation).toBe(
      'export const testParams = zod.object({\n  "id": zod.string()\n})\n\nexport const testQueryParams = zod.object({\n  "page": zod.number().optional()\n})\n\nexport const testHeader = zod.object({\n  "x-header": zod.string()\n})\n\nexport const testBody = zod.object({\n  "name": zod.string().optional()\n})\n\nexport const testResponse = zod.object({\n  "name": zod.string().optional()\n})\n\n',
    );
  });

  it('Only generate response body', async () => {
    const result = await generateZod(
      {
        pathRoute: '/cats',
        verb: 'post',
        operationName: 'test',
        override: {
          zod: {
            strict: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: false,
            },
            generate: {
              param: false,
              body: false,
              response: true,
              query: false,
              header: false,
            },
            coerce: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: false,
            },
          },
        },
      },
      basicApiSchema,
      {},
    );
    expect(result.implementation).toBe(
      'export const testResponse = zod.object({\n  "name": zod.string().optional()\n})\n\n',
    );
  });

  it('Only generate request body', async () => {
    const result = await generateZod(
      {
        pathRoute: '/cats',
        verb: 'post',
        operationName: 'test',
        override: {
          zod: {
            strict: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: false,
            },
            generate: {
              param: false,
              body: true,
              response: false,
              query: false,
              header: false,
            },
            coerce: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: false,
            },
          },
        },
      },
      basicApiSchema,
      {},
    );
    expect(result.implementation).toBe(
      'export const testBody = zod.object({\n  "name": zod.string().optional()\n})\n\n',
    );
  });

  it('Only generate query params', async () => {
    const result = await generateZod(
      {
        pathRoute: '/cats',
        verb: 'post',
        operationName: 'test',
        override: {
          zod: {
            strict: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: false,
            },
            generate: {
              param: false,
              body: false,
              response: false,
              query: true,
              header: false,
            },
            coerce: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: false,
            },
          },
        },
      },
      basicApiSchema,
      {},
    );
    expect(result.implementation).toBe(
      'export const testQueryParams = zod.object({\n  "page": zod.number().optional()\n})\n\n',
    );
  });

  it('Only generate url params', async () => {
    const result = await generateZod(
      {
        pathRoute: '/cats',
        verb: 'post',
        operationName: 'test',
        override: {
          zod: {
            strict: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: false,
            },
            generate: {
              param: true,
              body: false,
              response: false,
              query: false,
              header: false,
            },
            coerce: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: false,
            },
          },
        },
      },
      basicApiSchema,
      {},
    );
    expect(result.implementation).toBe(
      'export const testParams = zod.object({\n  "id": zod.string()\n})\n\n',
    );
  });

  it('Only generate header', async () => {
    const result = await generateZod(
      {
        pathRoute: '/cats',
        verb: 'post',
        operationName: 'test',
        override: {
          zod: {
            strict: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: false,
            },
            generate: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: true,
            },
            coerce: {
              param: false,
              body: false,
              response: false,
              query: false,
              header: false,
            },
          },
        },
      },
      basicApiSchema,
      {},
    );
    expect(result.implementation).toBe(
      'export const testHeader = zod.object({\n  "x-header": zod.string()\n})\n\n',
    );
  });
});

const arrayWithPrefixItemsSchema: SchemaObject31 = {
  type: "array",
  prefixItems: [
    {type: "string"},
    {}
  ],
  items:
    {type: "string"},
}

describe("parsePrefixItemsArrayAsTupleZod", ()=>{
  it('generates correctly', async () => {
    createLogger().info(`${arrayWithPrefixItemsSchema}`)
    const result = generateZodValidationSchemaDefinition(
      arrayWithPrefixItemsSchema as SchemaObject,
      {
        output: {
          override: {
            zod: {

            }
          }
        }
      } as ContextSpecs,
      'example_tuple',
      true,
      {
        required: true,
      },
    );
    createLogger().info(`${result}`)

    expect(result).toMatchSnapshot()
    expect(result).toEqual({
      functions: [
        ["tuple", [["string", undefined], ["object", undefined]]],
        ["rest", ["string", undefined]]
      ],
      consts: [],
    });
  });
})