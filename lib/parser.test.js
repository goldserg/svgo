'use strict';

const { parseSvg } = require('./parser.js');

/**
 * Build an SVG that references a declared entity `count` times.
 *
 * @param {number} count
 */
const buildSvgWithEntities = (count) =>
  `<!DOCTYPE svg [ <!ENTITY a "1"> ]>` +
  `<svg xmlns="http://www.w3.org/2000/svg"><text>${'&a;'.repeat(
    count,
  )}</text></svg>`;

describe('parseSvg maxEntityCount', () => {
  it('forwards a provided maxEntityCount to the sax parser', () => {
    /** @type {Record<string, unknown> | undefined} */
    let receivedOpt;
    jest.resetModules();
    jest.doMock('sax', () => {
      const actual = jest.requireActual('sax');
      return {
        ...actual,
        /**
         * @param {boolean} strict
         * @param {Record<string, unknown>} opt
         */
        parser: (strict, opt) => {
          receivedOpt = opt;
          return actual.parser(strict, opt);
        },
      };
    });
    const { parseSvg: parseSvgMocked } = require('./parser.js');
    parseSvgMocked(
      '<svg xmlns="http://www.w3.org/2000/svg"/>',
      undefined,
      1234,
    );
    expect(receivedOpt?.maxEntityCount).toBe(1234);
    jest.dontMock('sax');
    jest.resetModules();
  });

  it('throws when the entity count exceeds the sax default limit (512)', () => {
    expect(() => parseSvg(buildSvgWithEntities(600))).toThrow(/entity count/i);
  });

  it('allows raising the limit via maxEntityCount', () => {
    expect(() =>
      parseSvg(buildSvgWithEntities(600), undefined, 1000),
    ).not.toThrow();
  });
});
