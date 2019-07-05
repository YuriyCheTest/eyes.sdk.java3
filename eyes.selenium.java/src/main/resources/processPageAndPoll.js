/* @applitools/dom-snapshot@1.3.5 */

function __processPageAndPoll() {
  var processPageAndPoll = (function () {
  'use strict';

  // This code was copied and modified from https://github.com/beatgammit/base64-js/blob/bf68aaa277/index.js
  // License: https://github.com/beatgammit/base64-js/blob/bf68aaa277d9de7007cc0c58279c411bb10670ac/LICENSE

  function arrayBufferToBase64(ab) {
    const lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

    const uint8 = new Uint8Array(ab);
    const len = uint8.length;
    const extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
    const parts = [];
    const maxChunkLength = 16383; // must be multiple of 3

    let tmp;

    // go through the array every three bytes, we'll deal with trailing stuff later
    for (let i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      parts.push(lookup[tmp >> 2] + lookup[(tmp << 4) & 0x3f] + '==');
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + uint8[len - 1];
      parts.push(lookup[tmp >> 10] + lookup[(tmp >> 4) & 0x3f] + lookup[(tmp << 2) & 0x3f] + '=');
    }

    return parts.join('');

    function tripletToBase64(num) {
      return (
        lookup[(num >> 18) & 0x3f] +
        lookup[(num >> 12) & 0x3f] +
        lookup[(num >> 6) & 0x3f] +
        lookup[num & 0x3f]
      );
    }

    function encodeChunk(start, end) {
      let tmp;
      const output = [];
      for (let i = start; i < end; i += 3) {
        tmp = ((uint8[i] << 16) & 0xff0000) + ((uint8[i + 1] << 8) & 0xff00) + (uint8[i + 2] & 0xff);
        output.push(tripletToBase64(tmp));
      }
      return output.join('');
    }
  }

  var arrayBufferToBase64_1 = arrayBufferToBase64;

  function extractLinks(doc = document) {
    const srcsetUrls = Array.from(doc.querySelectorAll('img[srcset],source[srcset]'))
      .map(srcsetEl =>
        srcsetEl
          .getAttribute('srcset')
          .split(',')
          .map(str => str.trim().split(/\s+/)[0]),
      )
      .reduce((acc, urls) => acc.concat(urls), []);

    const srcUrls = Array.from(doc.querySelectorAll('img[src],source[src]')).map(srcEl =>
      srcEl.getAttribute('src'),
    );

    const imageUrls = Array.from(doc.querySelectorAll('image,use'))
      .map(hrefEl => hrefEl.getAttribute('href') || hrefEl.getAttribute('xlink:href'))
      .filter(u => u && u[0] !== '#');

    const objectUrls = Array.from(doc.querySelectorAll('object'))
      .map(el => el.getAttribute('data'))
      .filter(Boolean);

    const cssUrls = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map(link =>
      link.getAttribute('href'),
    );

    const videoPosterUrls = Array.from(doc.querySelectorAll('video[poster]')).map(videoEl =>
      videoEl.getAttribute('poster'),
    );

    return Array.from(srcsetUrls)
      .concat(Array.from(srcUrls))
      .concat(Array.from(imageUrls))
      .concat(Array.from(cssUrls))
      .concat(Array.from(videoPosterUrls))
      .concat(Array.from(objectUrls));
  }

  var extractLinks_1 = extractLinks;

  /* eslint-disable no-use-before-define */

  function domNodesToCdt(docNode) {
    const cdt = [
      {
        nodeType: Node.DOCUMENT_NODE,
      },
    ];
    const documents = [docNode];
    cdt[0].childNodeIndexes = childrenFactory(cdt, documents, docNode.childNodes);
    return {cdt, documents};

    function childrenFactory(domNodes, documents, elementNodes) {
      if (!elementNodes || elementNodes.length === 0) return null;

      const childIndexes = [];
      Array.prototype.forEach.call(elementNodes, elementNode => {
        const index = elementNodeFactory(domNodes, documents, elementNode);
        if (index !== null) {
          childIndexes.push(index);
        }
      });

      return childIndexes;
    }

    function elementNodeFactory(domNodes, documents, elementNode) {
      let node, manualChildNodeIndexes;
      const {nodeType} = elementNode;
      if ([Node.ELEMENT_NODE, Node.DOCUMENT_FRAGMENT_NODE].includes(nodeType)) {
        if (elementNode.nodeName !== 'SCRIPT') {
          if (
            elementNode.nodeName === 'STYLE' &&
            elementNode.sheet &&
            elementNode.sheet.cssRules.length
          ) {
            domNodes.push({
              nodeType: Node.TEXT_NODE,
              nodeValue: Array.from(elementNode.sheet.cssRules)
                .map(rule => rule.cssText)
                .join(''),
            });
            manualChildNodeIndexes = [domNodes.length - 1];
          }

          node = {
            nodeType: nodeType,
            nodeName: elementNode.nodeName,
            attributes: nodeAttributes(elementNode).map(key => {
              let value = elementNode.attributes[key].value;
              const name = elementNode.attributes[key].name;

              if (/^blob:/.test(value)) {
                value = value.replace(/^blob:/, '');
              } else if (
                elementNode.nodeName === 'IFRAME' &&
                name === 'src' &&
                !elementNode.contentDocument &&
                !value.match(/^\s*data:/)
              ) {
                value = '';
              }
              return {
                name,
                value,
              };
            }),
            childNodeIndexes:
              manualChildNodeIndexes ||
              (elementNode.childNodes.length
                ? childrenFactory(domNodes, documents, elementNode.childNodes)
                : []),
          };

          if (elementNode.shadowRoot) {
            node.shadowRootIndex = elementNodeFactory(domNodes, documents, elementNode.shadowRoot);
            documents.push(elementNode.shadowRoot);
          }

          if (elementNode.checked && !elementNode.attributes.checked) {
            node.attributes.push({name: 'checked', value: 'checked'});
          }
          if (
            elementNode.value !== undefined &&
            elementNode.attributes.value === undefined &&
            elementNode.tagName === 'INPUT'
          ) {
            node.attributes.push({name: 'value', value: elementNode.value});
          }
        } else {
          node = {
            nodeType: Node.ELEMENT_NODE,
            nodeName: 'SCRIPT',
            attributes: nodeAttributes(elementNode)
              .map(key => ({
                name: elementNode.attributes[key].name,
                value: elementNode.attributes[key].value,
              }))
              .filter(attr => attr.name !== 'src'),
            childNodeIndexes: [],
          };
        }
      } else if (nodeType === Node.TEXT_NODE) {
        node = {
          nodeType: Node.TEXT_NODE,
          nodeValue: elementNode.nodeValue,
        };
      } else if (nodeType === Node.DOCUMENT_TYPE_NODE) {
        node = {
          nodeType: Node.DOCUMENT_TYPE_NODE,
          nodeName: elementNode.nodeName,
        };
      }

      if (node) {
        domNodes.push(node);
        return domNodes.length - 1;
      } else {
        // console.log(`Unknown nodeType: ${nodeType}`);
        return null;
      }

      function nodeAttributes({attributes = {}}) {
        return Object.keys(attributes).filter(k => attributes[k] && attributes[k].name);
      }
    }
  }

  var domNodesToCdt_1 = domNodesToCdt;

  function flat(arr) {
    return [].concat(...arr);
  }

  var flat_1 = flat;

  function extractFrames(documents = [document]) {
    const iframes = flat_1(
      documents.map(d => Array.from(d.querySelectorAll('iframe[src]:not([src=""])'))),
    );
    return iframes
      .map(srcEl => {
        try {
          const contentDoc = srcEl.contentDocument;
          return (
            contentDoc &&
            /^https?:$/.test(contentDoc.location.protocol) &&
            contentDoc.defaultView &&
            contentDoc.defaultView.frameElement &&
            contentDoc
          );
        } catch (err) {
          //for CORS frames
        }
      })
      .filter(x => !!x);
  }

  var extractFrames_1 = extractFrames;

  function uniq(arr) {
    const result = [];
    new Set(arr).forEach(v => v && result.push(v));
    return result;
  }

  var uniq_1 = uniq;

  function aggregateResourceUrlsAndBlobs(resourceUrlsAndBlobsArr) {
    return resourceUrlsAndBlobsArr.reduce(
      ({resourceUrls: allResourceUrls, blobsObj: allBlobsObj}, {resourceUrls, blobsObj}) => ({
        resourceUrls: uniq_1(allResourceUrls.concat(resourceUrls)),
        blobsObj: Object.assign(allBlobsObj, blobsObj),
      }),
      {resourceUrls: [], blobsObj: {}},
    );
  }

  var aggregateResourceUrlsAndBlobs_1 = aggregateResourceUrlsAndBlobs;

  function makeGetResourceUrlsAndBlobs({processResource, aggregateResourceUrlsAndBlobs}) {
    return function getResourceUrlsAndBlobs(documents, baseUrl, urls) {
      return Promise.all(
        urls.map(url => processResource(url, documents, baseUrl, getResourceUrlsAndBlobs)),
      ).then(resourceUrlsAndBlobsArr => aggregateResourceUrlsAndBlobs(resourceUrlsAndBlobsArr));
    };
  }

  var getResourceUrlsAndBlobs = makeGetResourceUrlsAndBlobs;

  function filterInlineUrl(absoluteUrl) {
    return /^(blob|https?):/.test(absoluteUrl);
  }

  var filterInlineUrl_1 = filterInlineUrl;

  function toUnAnchoredUri(url) {
    const m = url && url.match(/(^[^#]*)/);
    const res = (m && m[1]) || url;
    return (res && res.replace(/\?\s*$/, '')) || url;
  }

  var toUnAnchoredUri_1 = toUnAnchoredUri;

  function absolutizeUrl(url, absoluteUrl) {
    return new URL(url, absoluteUrl).href;
  }

  var absolutizeUrl_1 = absolutizeUrl;

  function createTempStylsheet(cssContent) {
    if (!cssContent) {
      console.log('[dom-snapshot] error createTempStylsheet called without cssContent');
      return;
    }
    const head = document.head || document.querySelectorAll('head')[0];
    const style = document.createElement('style');
    style.type = 'text/css';
    style.setAttribute('data-desc', 'Applitools tmp variable created by DOM SNAPSHOT');
    head.appendChild(style);

    // This is required for IE8 and below.
    if (style.styleSheet) {
      style.styleSheet.cssText = cssContent;
    } else {
      style.appendChild(document.createTextNode(cssContent));
    }
    return style.sheet;
  }

  var createTempStyleSheet = createTempStylsheet;

  function makeExtractResourcesFromStyle({extractResourcesFromStyleSheet}) {
    return function extractResourcesFromStyle(styleSheet, cssContent, doc = document) {
      let corsFreeStyleSheet;
      try {
        styleSheet.cssRules;
        corsFreeStyleSheet = styleSheet;
      } catch (e) {
        console.log(
          `[dom-snapshot] could not access cssRules for ${styleSheet.href} ${e}\ncreating temp style for access.`,
        );
        corsFreeStyleSheet = createTempStyleSheet(cssContent);
      }

      const result = extractResourcesFromStyleSheet(corsFreeStyleSheet, doc);
      if (corsFreeStyleSheet !== styleSheet) {
        corsFreeStyleSheet.ownerNode.parentNode.removeChild(corsFreeStyleSheet.ownerNode);
      }
      return result;
    };
  }

  var extractResourcesFromStyle = makeExtractResourcesFromStyle;

  function makeProcessResource({
    fetchUrl,
    findStyleSheetByUrl,
    extractResourcesFromStyleSheet,
    extractResourcesFromSvg,
    isSameOrigin,
    cache = {},
  }) {
    const extractResourcesFromStyle$$1 = extractResourcesFromStyle({extractResourcesFromStyleSheet});
    return function processResource(absoluteUrl, documents, baseUrl, getResourceUrlsAndBlobs) {
      return cache[absoluteUrl] || (cache[absoluteUrl] = doProcessResource(absoluteUrl));

      function doProcessResource(url) {
        return fetchUrl(url)
          .catch(e => {
            if (probablyCORS(e, url)) {
              return {probablyCORS: true, url};
            } else {
              throw e;
            }
          })
          .then(({url, type, value, probablyCORS}) => {
            if (probablyCORS) {
              return {resourceUrls: [url]};
            }

            let resourceUrls;
            let result = {blobsObj: {[url]: {type, value}}};
            if (/text\/css/.test(type)) {
              const styleSheet = findStyleSheetByUrl(url, documents);
              if (styleSheet) {
                resourceUrls = extractResourcesFromStyle$$1(styleSheet, value, documents[0]);
              }
            } else if (/image\/svg/.test(type)) {
              resourceUrls = extractResourcesFromSvg(value);
            }

            if (resourceUrls) {
              resourceUrls = resourceUrls
                .map(toUnAnchoredUri_1)
                .map(resourceUrl => absolutizeUrl_1(resourceUrl, url.replace(/^blob:/, '')))
                .filter(filterInlineUrl_1);
              result = getResourceUrlsAndBlobs(documents, baseUrl, resourceUrls).then(
                ({resourceUrls, blobsObj}) => ({
                  resourceUrls,
                  blobsObj: Object.assign(blobsObj, {[url]: {type, value}}),
                }),
              );
            }
            return result;
          })
          .catch(err => {
            console.log('[dom-snapshot] error while fetching', url, err);
            return {};
          });
      }

      function probablyCORS(err, url) {
        const msgCORS =
          err.message &&
          (err.message.includes('Failed to fetch') || err.message.includes('Network request failed'));
        const nameCORS = err.name && err.name.includes('TypeError');
        return msgCORS && nameCORS && !isSameOrigin(url, baseUrl);
      }
    };
  }

  var processResource = makeProcessResource;

  function makeExtractResourcesFromSvg({parser, decoder}) {
    return function(svgArrayBuffer) {
      let svgStr;
      let urls = [];
      try {
        const decooder = decoder || new TextDecoder('utf-8');
        svgStr = decooder.decode(svgArrayBuffer);
        const domparser = parser || new DOMParser();
        const doc = domparser.parseFromString(svgStr, 'image/svg+xml');

        const fromImages = Array.from(doc.getElementsByTagName('image'))
          .concat(Array.from(doc.getElementsByTagName('use')))
          .map(e => e.getAttribute('href') || e.getAttribute('xlink:href'));
        const fromObjects = Array.from(doc.getElementsByTagName('object')).map(e =>
          e.getAttribute('data'),
        );
        urls = fromImages.concat(fromObjects).filter(u => u[0] !== '#');
      } catch (e) {
        console.log('could not parse svg content', e);
      }
      return urls;
    };
  }

  var makeExtractResourcesFromSvg_1 = makeExtractResourcesFromSvg;

  /* global window */

  function fetchUrl(url, fetch = window.fetch) {
    return fetch(url, {cache: 'force-cache', credentials: 'same-origin'}).then(resp =>
      resp.status === 200
        ? resp.arrayBuffer().then(buff => ({
            url,
            type: resp.headers.get('Content-Type'),
            value: buff,
          }))
        : Promise.reject(`bad status code ${resp.status}`),
    );
  }

  var fetchUrl_1 = fetchUrl;

  function makeFindStyleSheetByUrl({styleSheetCache}) {
    return function findStyleSheetByUrl(url, documents) {
      const allStylesheets = flat_1(documents.map(d => Array.from(d.styleSheets)));
      return (
        styleSheetCache[url] ||
        allStylesheets.find(styleSheet => styleSheet.href && toUnAnchoredUri_1(styleSheet.href) === url)
      );
    };
  }

  var findStyleSheetByUrl = makeFindStyleSheetByUrl;

  function getUrlFromCssText(cssText) {
    const re = /url\((?!['"]?:)['"]?([^'")]*)['"]?\)/g;
    const ret = [];
    let result;
    while ((result = re.exec(cssText)) !== null) {
      ret.push(result[1]);
    }
    return ret;
  }

  var getUrlFromCssText_1 = getUrlFromCssText;

  function makeExtractResourcesFromStyleSheet({styleSheetCache}) {
    return function extractResourcesFromStyleSheet(styleSheet, doc = document) {
      const win = doc.defaultView || doc.ownerDocument.defaultView;
      return uniq_1(
        Array.from(styleSheet.cssRules || []).reduce((acc, rule) => {
          if (rule instanceof win.CSSImportRule) {
            styleSheetCache[rule.styleSheet.href] = rule.styleSheet;
            return acc.concat(rule.href);
          } else if (rule instanceof win.CSSFontFaceRule) {
            return acc.concat(getUrlFromCssText_1(rule.cssText));
          } else if (
            (win.CSSSupportsRule && rule instanceof win.CSSSupportsRule) ||
            rule instanceof win.CSSMediaRule
          ) {
            return acc.concat(extractResourcesFromStyleSheet(rule));
          } else if (rule instanceof win.CSSStyleRule) {
            for (let i = 0, ii = rule.style.length; i < ii; i++) {
              const urls = getUrlFromCssText_1(rule.style.getPropertyValue(rule.style[i]));
              urls.length && (acc = acc.concat(urls));
            }
          }
          return acc;
        }, []),
      );
    };
  }

  var extractResourcesFromStyleSheet = makeExtractResourcesFromStyleSheet;

  function extractResourceUrlsFromStyleAttrs(cdt) {
    return cdt.reduce((acc, node) => {
      if (node.nodeType === 1) {
        const styleAttr =
          node.attributes && node.attributes.find(attr => attr.name.toUpperCase() === 'STYLE');

        if (styleAttr) acc = acc.concat(getUrlFromCssText_1(styleAttr.value));
      }
      return acc;
    }, []);
  }

  var extractResourceUrlsFromStyleAttrs_1 = extractResourceUrlsFromStyleAttrs;

  function makeExtractResourceUrlsFromStyleTags(extractResourcesFromStyleSheet) {
    return function extractResourceUrlsFromStyleTags(doc) {
      return uniq_1(
        Array.from(doc.querySelectorAll('style')).reduce((resourceUrls, styleEl) => {
          const styleSheet = Array.from(doc.styleSheets).find(
            styleSheet => styleSheet.ownerNode === styleEl,
          );
          return styleSheet
            ? resourceUrls.concat(extractResourcesFromStyleSheet(styleSheet, doc))
            : resourceUrls;
        }, []),
      );
    };
  }

  var extractResourceUrlsFromStyleTags = makeExtractResourceUrlsFromStyleTags;

  function toUriEncoding(url) {
    const result =
      (url &&
        url.replace(/(\\[0-9a-fA-F]{1,6}\s?)/g, s => {
          const int = parseInt(s.substr(1).trim(), 16);
          return String.fromCodePoint(int);
        })) ||
      url;
    return result;
  }

  var toUriEncoding_1 = toUriEncoding;

  function isSameOrigin(url, baseUrl) {
    const blobOrData = /^(blob|data):/;
    if (blobOrData.test(url)) return true;
    if (blobOrData.test(baseUrl)) return false;

    const {origin} = new URL(url, baseUrl);
    const {origin: baseOrigin} = new URL(baseUrl);
    return origin === baseOrigin;
  }

  var isSameOrigin_1 = isSameOrigin;

  function processPage(doc = document) {
    const styleSheetCache = {};
    const extractResourcesFromStyleSheet$$1 = extractResourcesFromStyleSheet({styleSheetCache});
    const extractResourcesFromSvg = makeExtractResourcesFromSvg_1({});
    const findStyleSheetByUrl$$1 = findStyleSheetByUrl({styleSheetCache});
    const processResource$$1 = processResource({
      fetchUrl: fetchUrl_1,
      findStyleSheetByUrl: findStyleSheetByUrl$$1,
      extractResourcesFromStyleSheet: extractResourcesFromStyleSheet$$1,
      extractResourcesFromSvg,
      absolutizeUrl: absolutizeUrl_1,
      isSameOrigin: isSameOrigin_1,
    });

    const getResourceUrlsAndBlobs$$1 = getResourceUrlsAndBlobs({
      processResource: processResource$$1,
      aggregateResourceUrlsAndBlobs: aggregateResourceUrlsAndBlobs_1,
    });

    const extractResourceUrlsFromStyleTags$$1 = extractResourceUrlsFromStyleTags(
      extractResourcesFromStyleSheet$$1,
    );

    return doProcessPage(doc);

    function doProcessPage(doc) {
      const frameElement = doc.defaultView && doc.defaultView.frameElement;
      const url = frameElement ? frameElement.src : doc.location.href;

      const {cdt, documents} = domNodesToCdt_1(doc);

      const linkUrls = flat_1(documents.map(extractLinks_1));
      const styleTagUrls = flat_1(documents.map(extractResourceUrlsFromStyleTags$$1));
      const links = uniq_1(
        Array.from(linkUrls)
          .concat(Array.from(styleTagUrls))
          .concat(extractResourceUrlsFromStyleAttrs_1(cdt)),
      )
        .map(toUnAnchoredUri_1)
        .map(toUriEncoding_1)
        .map(absolutizeThisUrl)
        .filter(filterInlineUrlsIfExisting);

      const resourceUrlsAndBlobsPromise = getResourceUrlsAndBlobs$$1(documents, url, links);

      const frameDocs = extractFrames_1(documents);
      const processFramesPromise = frameDocs.map(doProcessPage);

      return Promise.all([resourceUrlsAndBlobsPromise, ...processFramesPromise]).then(
        ([{resourceUrls, blobsObj}, ...framesResults]) => ({
          cdt,
          url,
          resourceUrls,
          blobs: blobsObjToArray(blobsObj),
          frames: framesResults,
          srcAttr: frameElement ? frameElement.getAttribute('src') : undefined,
        }),
      );

      function absolutizeThisUrl(someUrl) {
        try {
          return absolutizeUrl_1(someUrl, url);
        } catch (err) {
          // can't do anything with a non-absolute url
        }
      }
    }
  }

  function blobsObjToArray(blobsObj) {
    return Object.keys(blobsObj).map(blobUrl =>
      Object.assign(
        {
          url: blobUrl.replace(/^blob:/, ''),
        },
        blobsObj[blobUrl],
      ),
    );
  }

  function filterInlineUrlsIfExisting(absoluteUrl) {
    return absoluteUrl && filterInlineUrl_1(absoluteUrl);
  }

  var processPage_1 = processPage;

  function processPageAndSerialize(doc) {
    return processPage_1(doc).then(serializeFrame);
  }

  function serializeFrame(frame) {
    frame.blobs = frame.blobs.map(({url, type, value}) => ({
      url,
      type,
      value: arrayBufferToBase64_1(value),
    }));
    frame.frames.forEach(serializeFrame);
    return frame;
  }

  var processPageAndSerialize_1 = processPageAndSerialize;

  const EYES_NAME_SPACE = '__EYES__APPLITOOLS__';

  function processPageAndPoll(doc) {
    if (!window[EYES_NAME_SPACE]) {
      window[EYES_NAME_SPACE] = {};
    }
    if (!window[EYES_NAME_SPACE].processPageAndSerializeResult) {
      window[EYES_NAME_SPACE].processPageAndSerializeResult = {
        status: 'WIP',
        value: null,
        error: null,
      };
      processPageAndSerialize_1(doc)
        .then(r => ((resultObject.status = 'SUCCESS'), (resultObject.value = r)))
        .catch(e => ((resultObject.status = 'ERROR'), (resultObject.error = e.message)));
    }

    const resultObject = window[EYES_NAME_SPACE].processPageAndSerializeResult;
    if (resultObject.status === 'SUCCESS') {
      window[EYES_NAME_SPACE].processPageAndSerializeResult = null;
    }

    return JSON.stringify(resultObject);
  }

  var processPageAndPoll_1 = processPageAndPoll;

  return processPageAndPoll_1;

}());

  return processPageAndPoll.apply(this, arguments);
}