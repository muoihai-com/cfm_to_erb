import { SINGLE_TAGS, parse, expression_in_tag } from './lib';

export default function cfmToErb(text) {
  return flow([parse, convert, remove_comment])(text);
}

function flow(cbs) {
  return text => cbs.reduce((_, cb) => cb(_), text);
}

function convert(node) {
  switch (node.name) {
    case 'root':
      return convert_root(node);
    case 'cfif':
      return convert_cfif(node);
    case 'text':
      return convert_text(node);
    case 'cfelse':
      return '<% else %>';
    case 'cfelseif':
      return convert_cfelseif(node);
    case 'cfset':
      return convert_cfset(node);
    case 'cfbreak':
      return '<% break %>';
    case 'cfloop':
      return convert_cfloop(node);
    default:
      return convert_default(node);
  }
}

function convert_text(node){
  let text = node.content;
  text = text.replaceAll(/##/g, "==@@");
  if(!text.match(/#/)) return text.replaceAll("==@@", "#");

  let arr = text.split(/(["#'])/);

  let begin = -1;
  let countA = 0;
  let countB = 0;
  for(let i = 0; i < arr.length; i++) {
    if(arr[i] === "#") {
      if(begin === -1) begin = i;

      countA += 1;
      if (countA > 0 && countA % 2 === 0 && countB % 2 === 0 && begin !== -1) {
        arr[begin] = "<%= ";
        arr[i] = " %>";

        countA = 0;
        countB = 0;
        begin = -1;
      }
      continue;
    }

    if(countA > 0 && (arr[i] === '"' || arr[i] === "'")) {
      countB += 1;
      continue;
    }
  }

  return arr.join("").replaceAll("==@@", "#");
}

function convert_cfif(node) {
  let tmp = node.content.replaceAll(/<cfif ([\s\S]*?)>/g, (match, p1) => {
    return `<% if ${expression_in_tag(p1)} %>`;
  });

  if(node.children.length === 1 &&
    node.first().name === "text" &&
    node.first().content.trim().length < 50 &&
    node.first().content.trim().length > 0) {

    return tmp.replace("<% if", `<%= "${node.first().content.trim()}" if`);
  }

  tmp += convert_root(node);
  tmp += "<% end %>";

  return tmp;
}

function convert_root(node) {
  let tmp = "";
  node.children.forEach((childNode) => {
    tmp += convert(childNode);
  });

  return tmp;
}

function convert_default(node) {
  let tmp = node.content;
  if(SINGLE_TAGS.includes(node.name)) return tmp;

  tmp += convert_root(node);
  tmp += `</${node.name}>`;

  return tmp;
}

function convert_cfelseif(node) {
  return node.content.replaceAll(/<cfelseif ([\s\S]*?)>/g, (match, p1) => {
    return `<% elsif ${expression_in_tag(p1)} %>`;
  });
}

function convert_cfset(node) {
  return node.content.replaceAll(/<cfset ([\w.]+?) = ([\s\S]*?)>/g, (match, p1, p2) => {
    return `<% ${p1} = ${expression_in_tag(p2)} %>`;
  });
}

function convert_cfloop(node) {
  let index = node.content.match(/index="(\w+?)"/);
  let from = node.content.match(/from="(\w+?)"/);
  let to = node.content.match(/to="(\w+?)"/);
  let step = node.content.match(/step="(\w+?)"/);
  let query = node.content.match(/query="(\w+?)"/);

  if(query) {
    let tmp = `<% @${query[1]}.each do |${underscore(query[1])}| %>`
    tmp += convert_root(node);
    tmp += "<% end %>";
    return tmp.replaceAll(query[1], underscore(query[1]));
  }


  if(index && from && to) {
    let tmp = `<% ${from[1]}.step(${to[1]}).each do |${index[1]}| %>`;
    if(step) tmp = `<% ${from[1]}.step(${to[1]}, ${step[1]}).each do |${index[1]}| %>`
    tmp += convert_root(node);
    tmp += "<% end %>";
    return tmp;
  }

  return convert_default(node);
}

function underscore(text) {
  return text.replaceAll(/(?=.)([A-Z])/g, (match, p1) => `_${p1.toLowerCase()}`)
}

function remove_comment(text) {
  return text.replaceAll(/<!---[\s\S]*?--->/g, "");
}
