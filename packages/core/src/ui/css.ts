const all = [] as string[];

export function css(strings: TemplateStringsArray, ...values: any[]) {
  all.push(
    strings.reduce((result, str, i) => result + str + (values[i] || ""), ""),
  );
}

export function render() {
  return all.join("\n");
}
