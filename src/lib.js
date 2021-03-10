export const SINGLE_TAGS = [
  "cfset", "cfcontinue", "cfelse", "cfelseif", "cfqueryparam", "cfparam", "cfbreak", "cfinclude"
];

export function MyNode(name, content = "") {
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

export function parse(text) {
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

export function expression_in_tag(text) {
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
    .replaceAll(/IsNumeric\(([\w"]+?)\)/g, 'is_numeric?($1)')
    .replaceAll(/ == ""/g, ".blank?");
}
