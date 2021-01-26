export default function cfmToErb(text, mode = "erb") {
  return [
    convert_cfif,
    convert_cfswitch,
    convert_cfset
  ].reduce((_, cb) => {
    returncb(_);
  }, text);
}

function convert_cfif(text, mode = "erb") {
  if(mode === "rb") {
    return text.replaceAll(/<cfif ([\s\S]*?)>/g, (match, p1) => {
      return `if ${expression_in_tag(p1)}`;
    }).replaceAll(/<cfelseif ([\s\S]*?)>/g, (match, p1) => {
      return `elsif ${expression_in_tag(p1)}`;
    }).replaceAll(/<cfelse>/g, "else")
      .replaceAll(/<\/cfif>/g, "end")
  }

  return text.replaceAll(/<cfif ([\s\S]*?)>/g, (match, p1) => {
    return `<% if ${expression_in_tag(p1)} %>`;
  }).replaceAll(/<cfelseif ([\s\S]*?)>/g, (match, p1) => {
    return `<% elsif ${expression_in_tag(p1)} %>`;
  }).replaceAll(/<cfelse>/g, "<% else %>")
    .replaceAll(/<\/cfif>/g, "<% end %>")
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
    .replaceAll(/ or /gi, " || ");
}

function convert_cfswitch(text, mode = "erb") {
  if(mode === "rb") {
    return text.replaceAll(/<cfswitch expression="#(.*?)#">/g, "case $1")
      .replaceAll(/<cfcase value="(.*?)">/g, "when $1")
      .replaceAll(/<\/cfcase>/g, "")
      .replaceAll(/<cfdefaultcase>/g, "else")
      .replaceAll(/<\/cfdefaultcase>/g, "")
      .replaceAll(/<\/cfswitch>/g, "end")
  }

  return text.replaceAll(/<cfswitch expression="#(.*?)#">/g, "<% case $1 %>")
    .replaceAll(/<cfcase value="(.*?)">/g, "<% when $1 %>")
    .replaceAll(/<\/cfcase>/g, "")
    .replaceAll(/<cfdefaultcase>/g, "<% else %>")
    .replaceAll(/<\/cfdefaultcase>/g, "")
    .replaceAll(/<\/cfswitch>/g, "<% end %>")
}

function convert_cfset(text, mode = "erb") {
  if(mode === "rb") {
    return text.replaceAll(/<cfset (.*?)=([\s\S]*?)>/g, (match, p1, p2) => {
      return `${p1.trim()} = ${expression_in_tag(p2)}`;
    });
  }

  return text.replaceAll(/<cfset (.*?)=([\s\S]*?)>/g, (match, p1, p2) => {
    return `<% ${p1.trim()} = ${expression_in_tag(p2)} %>`;
  });
}
