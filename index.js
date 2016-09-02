'use strict';

const yaml = require('js-yaml').safeDump

function transformAll(result) {
  return result.rows.map(transform).reduce((a,b) => a.concat(b), []);
}

function flatten(b) {
  let { props, ...base } = b

  if (base.block === 'Horizontal' || base.block === 'Vertical') {
    if (props.blocks) {
      base.blocks = props.blocks.map(flatten)
      delete props.blocks
    }
  } else if (base.block === 'List') {
    base.of = flatten(props.of)

    delete props.of
  }

  Object.keys(base).forEach(p => {
    if (/^@/.test(p)) {
      delete base[p]
    }
  })

  Object.keys(props).forEach(p => {
    if (/^@/.test(p)) {
      delete props[p]
    }
  })

  let { block, ...rbase } = base
  let { style, ...rest } = props

  if (style) {
    return {
      block,
      style,
      ...rbase,
      ...rest
    }
  } else {
    return {
      ...base,
      ...props
    }
  }
}

function indent(string, spaces = 2) {
  return string.replace(/^(?!$)/mg, new Array(spaces + 1).join(' '));
}

function toYaml(s) {
  try {
    return yaml(s)
  } catch(e) {
    if (typeof s === 'undefined') {
      return ''
    }
    console.error('error', e)
    return JSON.stringify(s)
  }
}

function transform({ doc }) {
  if (doc.Type === 'page') {
    const { blocks, floating, style, styleBackground, states, ...nextDoc } = doc

    if (!blocks) {
      console.log('(i)', nextDoc._id)
      return
    }

    console.log('[p]', nextDoc._id)

    const code = [
      `blocks:\n${toYaml(blocks.map(flatten))}`
    ]

    if (floating && floating.length > 0) {
      code.push(`floating:\n${toYaml(floating.map(flatten))}`)
    }

    code.push(`style:\n${indent(toYaml(style))}`)
    code.push(`styleBackground:\n${indent(toYaml(styleBackground))}`)

    nextDoc.code = code.join('\n')
    nextDoc.states = JSON.stringify(states, null, '  ')

    return nextDoc;
  }
}

const s = require(process.argv[2])
const f = transform({ doc: {...s, Type: 'page'}})
console.log('\n\nCODE\n\n')
console.log(f.code)
console.log('\n\nSTATES\n\n')
console.log(f.states)
