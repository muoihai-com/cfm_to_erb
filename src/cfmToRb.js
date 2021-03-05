export default function cfmToErb(text) {
  return flow([parse, convert, remove_comment])(text);
}

const SINGLE_TAGS = [
  "cfset", "cfcontinue", "cfelse", "cfelseif", "cfqueryparam", "cfparam", "cfbreak", "cfinclude"
];

function flow(cbs) {
  return text => cbs.reduce((_, cb) => cb(_), text);
}

function parse(text) {
  const data = text.split(/(<cf[\s\S]+?>|<\/cf.*?>)/);
  let root = new MyNode('root');

  var parent = root;
  data.forEach((t, index) => {
    if(t.match(/<cf[\s\S]+?>/)) {
      let match = t.match(/<(cf[a-z]+)[\s\S]*?>/);
      if(match) {
        const tag = new MyNode(match[1], match[0]);
        parent.add(tag);
        if(SINGLE_TAGS.includes(tag.name)) return;

        parent = tag;
      }
    } else if (t.match(/<\/cf.*?>/)) {
      let match = t.match(/<\/(cf.*?)>/);
      if(match && match[1] === parent.name) parent = parent.parent;
    } else {
      parent.add(new MyNode('text', t))
    }
  });

  return root;
}

function MyNode(name, content = "") {
  this.name = name;
  this.content = content;
  this.children = [];

  this.add = function(node) {
    this.children.push(node);
    node.parent = this;
  }

  this.first = function(node) {
    return this.children[0];
  }
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
      return 'else';
    case 'cfelseif':
      return convert_cfelseif(node);
    case 'cfset':
      return convert_cfset(node);
    case 'cfbreak':
      return 'break';
    case 'cfloop':
      return convert_cfloop(node);
    default:
      return convert_default(node);
  }
}

function convert_text(node){
  return node.content;
}

function convert_cfif(node) {
  let tmp = node.content.replaceAll(/<cfif ([\s\S]*?)>/g, (match, p1) => {
    return `if ${expression_in_tag(p1)}`;
  });

  if(node.children.length === 1 &&
    node.first().name === "text" &&
    node.first().content.trim().length < 40 &&
    node.first().content.trim().length > 0) {

    return tmp.replace("if", `"${node.first().content}" if`);
  }

  tmp += convert_root(node);
  tmp += "end";

  return tmp;
}

function expression_in_tag(text) {
  return text.trim()
    .replaceAll(/is equal/gi, "==")
    .replaceAll(/ eq /gi, " == ")
    .replaceAll(/ is not /gi, " != ")
    .replaceAll(/not equal/gi, "!=")
    .replaceAll(/ neq /gi, " != ")
    .replaceAll(/greater than/gi, ">")
    .replaceAll(/ gt /gi, " > ")
    .replaceAll(/less than/gi, "<")
    .replaceAll(/ lt /gi, " < ")
    .replaceAll(/greater than or equal to/gi, ">=")
    .replaceAll(/ gte /gi, " >= ")
    .replaceAll(/ ge /gi, " >= ")
    .replaceAll(/less than or equal to/gi, "<=")
    .replaceAll(/ lte /gi, " <= ")
    .replaceAll(/ le /gi, " <= ")
    .replaceAll(/ is /gi, " == ")
    .replaceAll(/ and /gi, " && ")
    .replaceAll(/ or /gi, " || ")
    .replaceAll(/chkPermission\("([\w"]+)"\) (is|==) 1/g, 'chk_permission?("$1")')
    .replaceAll(/ == ""/g, ".blank?");
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
    return `elsif ${expression_in_tag(p1)}`;
  });
}

function convert_cfset(node) {
  if(node.content.match(/<cfset error_msg = ListAppend\(error_msg, (.*?)\)>/))
    return node.content.replace(/<cfset error_msg = ListAppend\(error_msg, (.*?)\)>/, "@error_msg << $1")

  return node.content.replaceAll(/<cfset ([\w.]+?) = ([\s\S]*?)>/g, (match, p1, p2) => {
    return `${p1} = ${expression_in_tag(p2)}`;
  });
}

function convert_cfloop(node) {
  let query = node.content.match(/query="(\w+?)"/);
  if(!query) return node.content;

  let tmp = `@${query[1]}.each do |${underscore(query[1])}|`
  tmp += convert_root(node);
  tmp += "end";
  return tmp.replaceAll(query[1], underscore(query[1]));
}

function underscore(text) {
  return text.replaceAll(/(?=.)([A-Z])/g, (match, p1) => `_${p1.toLowerCase()}`)
}

function remove_comment(text) {
  return text.replaceAll(/<!---[\s\S]*?--->/g, "");
}
