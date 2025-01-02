import * as path from "path"
import * as fs from "fs"
import * as TypeDoc from "typedoc"
import config from "./config"

const OUTPUT_DIR = "src/content/docs/docs"
type Text = string | Text[]

configureLogger()
const project = await build()
const modules = project.getChildrenByKind(TypeDoc.ReflectionKind.Module)
const session = modules.find((m) => m.name === "session")!
const authorizer = modules.find((m) => m.name === "authorizer")!
const error = modules.find((m) => m.name === "error")!
const client = modules.find((m) => m.name === "client")!
const uis = modules.filter((m) => m.name.startsWith("ui/"))
const adapters = modules.filter((m) => m.name.startsWith("adapter/"))
const storages = modules.filter((m) => m.name.startsWith("storage/"))

const FRONTMATTER: Record<
  string,
  { title: string; editUrl: string; description: string }
> = {
  theme: {
    title: "Themes",
    description: "Reference docs for themes.",
    editUrl: `${config.github}/blob/master/packages/openauth/src/ui/theme.ts`,
  },
  password: {
    title: "PasswordUI",
    description: "Reference doc for the `PasswordUI`.",
    editUrl: `${config.github}/blob/master/packages/openauth/src/ui/password.tsx`,
  },
  code: {
    title: "CodeUI",
    description: "Reference doc for the `CodeUI`.",
    editUrl: `${config.github}/blob/master/packages/openauth/src/ui/code.tsx`,
  },
  select: {
    title: "Select",
    description: "Reference doc for the `Select` UI.",
    editUrl: `${config.github}/blob/master/packages/openauth/src/ui/select.tsx`,
  },
  dynamo: {
    title: "DynamoDB",
    description: "Reference doc for the DynamoDB storage adapter.",
    editUrl: `${config.github}/blob/master/packages/openauth/src/storage/dynamo.ts`,
  },
  memory: {
    title: "Memory",
    description: "Reference doc for the Memory storage adapter.",
    editUrl: `${config.github}/blob/master/packages/openauth/src/storage/memory.ts`,
  },
  cloudflare: {
    title: "Cloudflare KV",
    description: "Reference doc for the Cloudflare KV storage adapter.",
    editUrl: `${config.github}/blob/master/packages/openauth/src/storage/cloudflare.ts`,
  },
  client: {
    title: "Client",
    description: "Reference doc for the client SDK.",
    editUrl: `${config.github}/blob/master/packages/openauth/src/client.ts`,
  },
}

renderSession()
renderClient()
renderAuthorizer()
adapters.map(renderAdapter)
storages.map(renderStorage)
uis.map(renderUI)

function renderAdapter(module: TypeDoc.DeclarationReflection) {
  console.debug(`renderAdapter: ${module.name}`)

  const name = module.name.replace("adapter/", "")
  saveFile(module.name, [
    renderHeader({
      moduleName: module.name,
      editUrl: false,
      title: name,
      description: `A page for the ${name} adapter.`,
    }),
    `<div class="tsdoc">`,
    renderAbout(renderComment(module.comment)),
    renderFunctions(module),
    renderInterfaces(module),
    `</div>`,
  ])
}

function renderStorage(module: TypeDoc.DeclarationReflection) {
  console.debug(`renderStorage: ${module.name}`)

  const name = module.name.replace("storage/", "")
  const { title, editUrl, description } = FRONTMATTER[name] || {}
  saveFile(module.name, [
    renderHeader({
      title: title || name,
      moduleName: module.name,
      editUrl: editUrl || false,
      description: description || `A page for the ${name} storage.`,
    }),
    `<div class="tsdoc">`,
    renderAbout(renderComment(module.comment)),
    renderFunctions(module),
    renderInterfaces(module),
    `</div>`,
  ])
}

function renderUI(module: TypeDoc.DeclarationReflection) {
  console.debug(`renderUI: ${module.name}`)

  const name = module.name.replace("ui/", "")
  const { title, editUrl, description } = FRONTMATTER[name] || {}
  saveFile(module.name, [
    renderHeader({
      title: title || name,
      moduleName: module.name,
      editUrl: editUrl || false,
      description: description || `A page for the ${name} UI.`,
    }),
    `<div class="tsdoc">`,
    renderAbout(renderComment(module.comment)),
    renderVariables(module, { title: "Themes" }),
    renderFunctions(module),
    renderInterfaces(module),
    `</div>`,
  ])
}

function renderSession() {
  console.debug(`renderSession`)

  const module = session
  const name = module.name
  saveFile(name, [
    renderHeader({
      moduleName: module.name,
      editUrl: false,
      title: name,
      description: `A page for the session.`,
    }),
    `<div class="tsdoc">`,
    renderFunctions(module),
    `</div>`,
  ])
}

function renderClient() {
  console.debug(`renderClient`)

  const module = client
  const name = module.name
  const { title, editUrl, description } = FRONTMATTER[name] || {}
  saveFile(name, [
    renderHeader({
      title: title || name,
      moduleName: module.name,
      editUrl: editUrl || false,
      description: description || `A page for the client.`,
    }),
    `<div class="tsdoc">`,
    renderAbout(renderComment(module.comment)),
    renderFunctions(module),
    renderInterfaces(module),
    `</div>`,
  ])
}

function renderAuthorizer() {
  console.debug(`renderAuthorizer`)

  const errors = error.getChildrenByKind(TypeDoc.ReflectionKind.Class)
  const name = authorizer.name
  saveFile(name, [
    renderHeader({
      moduleName: authorizer.name,
      editUrl: false,
      title: name,
      description: `A page for the authorizer.`,
    }),
    `<div class="tsdoc">`,
    renderFunctions(authorizer),
    renderInterfaces(authorizer),
    render(errors.length, [`## Errors`, errors.map(renderClass)]),
    `</div>`,
  ])
}

function renderHeader(input: {
  moduleName: string
  title: string
  editUrl: string | boolean
  description: string
}) {
  const relativePath = path.relative(
    path.dirname(path.join(OUTPUT_DIR, `${input.moduleName}.mdx`)),
    "src/components/tsdoc",
  )
  return [
    `---`,
    `title: ${input.title}`,
    `editUrl: ${input.editUrl}`,
    `description: ${input.description}`,
    `---`,
    "",
    `import Segment from '${relativePath}/Segment.astro';`,
    `import Section from '${relativePath}/Section.astro';`,
    `import NestedTitle from '${relativePath}/NestedTitle.astro';`,
    `import InlineSection from '${relativePath}/InlineSection.astro';`,
    "",
  ]
}

function renderAbout(content: Text) {
  console.debug(` ∟renderAbout`)
  return [`<Section type="about">`, content, `</Section>`, "---"]
}

function renderClass(c: TypeDoc.DeclarationReflection) {
  console.debug(`   ∟class: ${c.name}`)
  return [`### ${c.name}`, `<Segment>`, renderComment(c.comment), `</Segment>`]
}

function renderVariables(
  module: TypeDoc.DeclarationReflection,
  options: {
    title: string
  },
) {
  console.debug(` ∟renderVariables`)
  const variables = module.getChildrenByKind(TypeDoc.ReflectionKind.Variable)
  return render(variables.length, [
    `## ${options.title}`,
    variables.map((v) => {
      console.debug(`   ∟variable: ${v.name}`)
      return [
        `### ${v.name}`,
        `<Segment>`,
        renderComment(v.comment),
        `</Segment>`,
      ]
    }),
  ])
}

function renderFunctions(module: TypeDoc.DeclarationReflection) {
  console.debug(` ∟renderFunctions`)
  const functions = module.getChildrenByKind(TypeDoc.ReflectionKind.Function)
  return render(functions.length, [
    "## Methods",
    ...functions.map((f) => {
      console.debug(`   ∟function: ${f.name}`)
      return [
        `### ${f.name}`,
        `<Segment>`,
        `<Section type="signature">`,
        renderSignatureAsCode(f.signatures![0]),
        `</Section>`,
        render(f.signatures![0].parameters?.length, [
          `<Section type="parameters">`,
          `#### Parameters`,
          f.signatures![0].parameters!.map((p) => {
            return [
              `- <p><code class="key">${renderParameter(p)}</code> ${renderType(p.type!)}</p>`,
              renderComment(p.comment),
            ]
          }),
          `</Section>`,
        ]),
        `<InlineSection>`,
        `**Returns** ${renderType(f.signatures![0].type!)}`,
        `</InlineSection>`,
        renderComment(f.signatures![0].comment),
        `</Segment>`,
      ]
    }),
  ])
}

function renderInterfaces(module: TypeDoc.DeclarationReflection) {
  console.debug(` ∟renderInterfaces`)
  const interfaces = module.getChildrenByKind(TypeDoc.ReflectionKind.Interface)
  return interfaces.map((i) => {
    console.debug(`   ∟interface: ${i.name}`)
    const properties = i.getChildrenByKind(TypeDoc.ReflectionKind.Property)
    const methods = i.getChildrenByKind(TypeDoc.ReflectionKind.Method)
    return [
      `## ${i.name}`,
      `<Segment>`,
      `<Section type="parameters">`,
      properties.map((p) => [
        `- <p>[<code class="key">${renderProperty(p)}</code>](#${buildLinkHash(i.name, p.name)}) ${renderType(p.type!)}</p>`,
        flattenNestedTypes(p.type!, p.name).map(
          ({ depth, prefix, subType }) =>
            `${" ".repeat(depth * 2)}- <p>[<code class="key">${renderProperty(
              subType,
            )}</code>](#${buildLinkHash(prefix, subType.name)}) ${renderType(subType.type!)}</p>`,
        ),
      ]),
      methods.map((m) => {
        return `- <p>[<code class="key">${renderProperty(m)}</code>](#${buildLinkHash(i.name, m.name)}) ${renderSignatureAsType(m.signatures![0])}</p>`
      }),
      `</Section>`,
      renderComment(i.comment),
      `</Segment>`,
      properties.flatMap((p) => [
        `<NestedTitle id="${buildLinkHash(i.name, p.name)}" Tag="h4" parent="${i.name}.">${renderProperty(p)}</NestedTitle>`,
        `<Segment>`,
        `<Section type="parameters">`,
        `<InlineSection>`,
        `**Type** ${renderType(p.type!)}`,
        `</InlineSection>`,
        `</Section>`,
        renderComment(p.comment),
        `</Segment>`,
        flattenNestedTypes(p.type!, p.name).map(
          ({ depth, prefix, subType }) => [
            `<NestedTitle id="${buildLinkHash(prefix, subType.name)}" Tag="h5" parent="${i.name}.${prefix}.">${renderProperty(subType)}</NestedTitle>`,
            `<Segment>`,
            `<Section type="parameters">`,
            `<InlineSection>`,
            `**Type** ${renderType(subType.type!)}`,
            `</InlineSection>`,
            `</Section>`,
            renderComment(subType.comment),
            `</Segment>`,
          ],
        ),
      ]),
      methods.flatMap((m) => [
        `<NestedTitle id="${buildLinkHash(i.name, m.name)}" Tag="h4" parent="${i.name}.">${renderProperty(m)}</NestedTitle>`,
        `<Segment>`,
        `<Section type="parameters">`,
        `<InlineSection>`,
        `**Type** ${renderSignatureAsType(m.signatures![0])}`,
        `</InlineSection>`,
        `</Section>`,
        renderComment(m.comment),
        `</Segment>`,
      ]),
    ]
  })
}

function renderComment(comment?: TypeDoc.Comment) {
  if (!comment) return []

  return [
    comment.blockTags
      .filter((tag) => tag.tag === "@default")
      .map((tag) => {
        return [
          ``,
          `<InlineSection>`,
          // If default tag is just a value, render it as a type ie. false
          // Otherwise render it as a comment ie. No domains configured
          tag.content.length === 1 && tag.content[0].kind === "code"
            ? `**Default** ${renderType(
              new TypeDoc.IntrinsicType(
                tag.content[0].text
                  .replace(/`/g, "")
                  .replace(/{/g, "&lcub;")
                  .replace(/}/g, "&rcub;"),
              ),
            )}`
            : `**Default** ${tag.content.map((c) => c.text)}`,
          `</InlineSection>`,
        ]
      }),
    comment.summary.map((s) => s.text),
    comment.blockTags
      .filter((tag) => tag.tag === "@example")
      .map((tag) => tag.content.map((c) => c.text)),
  ]
}

function renderSignatureAsCode(signature: TypeDoc.SignatureReflection) {
  const parameters = (signature.parameters ?? []).map(renderParameter)
  return ["```ts", `${signature.name}(${parameters})`, "```"]
}

function renderSignatureAsType(signature: TypeDoc.SignatureReflection) {
  const parameters = (signature.parameters ?? [])
    .map(
      (parameter) =>
        `${renderParameter(parameter)}: ${renderType(parameter.type!)}`,
    )
    .join(", ")
  return `<code class="primitive">(${parameters}) => ${renderType(
    signature.type!,
  )}</code>`
}

function renderParameter(parameter: TypeDoc.ParameterReflection) {
  if (parameter.defaultValue && parameter.defaultValue !== "{}") {
    throw new Error(
      [
        `Unsupported default value "${parameter.defaultValue}" for name "${parameter.name}".`,
        ``,
        `Function signature parameters can be defined as optional in one of two ways:`,
        ` - flag.isOptional is set, ie. "(args?: FooArgs)"`,
        ` - defaultValue is set, ie. "(args: FooArgs = {})`,
        ``,
        `But in this case, the default value is not "{}". Hence not supported.`,
      ].join("\n"),
    )
  }

  return [
    parameter.type?.type === "tuple" ? "..." : "",
    parameter.name,
    parameter.flags.isOptional || parameter.defaultValue ? "?" : "",
  ].join("")
}

function renderProperty(property: TypeDoc.DeclarationReflection) {
  return `${property.name}${property.flags.isOptional ? "?" : ""}`
}

function renderType(type: TypeDoc.SomeType): Text {
  if (type.type === "intrinsic") return renderIntrisicType(type)
  if (type.type === "literal") return renderLiteralType(type)
  if (type.type === "templateLiteral") return renderTemplateLiteralType(type)
  if (type.type === "union") return renderUnionType(type)
  if (type.type === "array") return renderArrayType(type)
  if (type.type === "reference") {
    if (type.package === "typescript") return renderTypescriptType(type)
    if (type.package === "@openauthjs/openauth") return renderOpenAuthType(type)
    return `<code class="type">${type.name}</code>`
  } else if (
    type.type === "reflection" &&
    type.declaration.kind === TypeDoc.ReflectionKind.TypeLiteral
  ) {
    return `<code class="primitive">object type</code>`
  }
  return `<code class="primitive">${type.type}</code>`

  function renderIntrisicType(type: TypeDoc.IntrinsicType) {
    return `<code class="primitive">${type.name}</code>`
  }
  function renderLiteralType(type: TypeDoc.LiteralType) {
    // Intrisic values: don't print in quotes
    // ie.
    // {
    //   "type": "literal",
    //   "value": false
    // }
    if (type.value === true || type.value === false) {
      return `<code class="primitive">${type.value}</code>`
    }
    // String value
    // ie.
    // {
    //   "type": "literal",
    //   "value": "arm64"
    // }
    const sanitized =
      typeof type.value === "string"
        ? type.value!.replace(/([*:])/g, "\\$1")
        : type.value
    return `<code class="symbol">&ldquo;</code><code class="primitive">${sanitized}</code><code class="symbol">&rdquo;</code>`
  }
  function renderTemplateLiteralType(type: TypeDoc.TemplateLiteralType) {
    // ie. memory: `${number} MB`
    // {
    //   "type": "templateLiteral",
    //   "head": "",
    //   "tail": [
    //     [
    //       {
    //         "type": "intrinsic",
    //         "name": "number"
    //       },
    //       " MB"
    //     ]
    //   ]
    // },
    if (
      typeof type.head !== "string" ||
      type.tail.length !== 1 ||
      type.tail[0].length !== 2 ||
      type.tail[0][0].type !== "intrinsic" ||
      typeof type.tail[0][1] !== "string"
    ) {
      console.error(type)
      throw new Error(`Unsupported templateLiteral type`)
    }
    return `<code class="symbol">&ldquo;</code><code class="primitive">${type.head}$\\{${type.tail[0][0].name}\\}${type.tail[0][1]}</code><code class="symbol">&rdquo;</code>`
  }
  function renderUnionType(type: TypeDoc.UnionType) {
    return type.types
      .map((t) => renderType(t))
      .join(`<code class="symbol"> | </code>`)
  }
  function renderArrayType(type: TypeDoc.ArrayType) {
    return type.elementType.type === "union"
      ? `<code class="symbol">(</code>${renderType(
        type.elementType,
      )}<code class="symbol">)[]</code>`
      : `${renderType(type.elementType)}<code class="symbol">[]</code>`
  }
  function renderTypescriptType(type: TypeDoc.ReferenceType) {
    // ie. Record<string, string>
    return [
      `<code class="primitive">${type.name}</code>`,
      `<code class="symbol">&lt;</code>`,
      type.typeArguments?.map((t) => renderType(t)).join(", "),
      `<code class="symbol">&gt;</code>`,
    ].join("")
  }
  function renderOpenAuthType(type: TypeDoc.ReferenceType) {
    // Reference to a non-documented type, ie. FetchLike
    if (!type.reflection) return `<code class="type">${type.name}</code>`

    if (type.reflection?.kind === TypeDoc.ReflectionKind.Class) {
      const r = type.reflection as TypeDoc.DeclarationReflection
      if (r.sources?.[0]?.fileName.endsWith("error.ts")) {
        return `[<code class="type">${r.name}</code>](/docs/authorizer#${r.name.toLowerCase()})`
      }
    }
    return `[<code class="type">${type.name}</code>](#${type.name.toLowerCase()})`
  }
}

function render(condition: any, content: Text) {
  return condition ? content : []
}

function buildLinkHash(namespace: string, name: string) {
  return `${namespace}.${name}`.toLowerCase()
}

function flattenNestedTypes(
  type: TypeDoc.SomeType,
  prefix: string,
  depth: number = 1,
): {
  subType: TypeDoc.DeclarationReflection
  prefix: string
  depth: number
}[] {
  if (type.type === "union") {
    return type.types.flatMap((t) => flattenNestedTypes(t, prefix, depth))
  }
  if (type.type === "array") {
    return flattenNestedTypes(type.elementType, `${prefix}[]`, depth)
  }
  if (type.type === "reference") {
    return (type.typeArguments ?? []).flatMap((t) =>
      type.package === "typescript" && type.name === "Record"
        ? flattenNestedTypes(t, `${prefix}[]`, depth)
        : flattenNestedTypes(t, prefix, depth),
    )
  }
  if (type.type === "reflection" && type.declaration.children?.length) {
    return type.declaration
      .children!.filter((c) => !c.comment?.modifierTags.has("@internal"))
      .filter((c) => !c.comment?.blockTags.find((t) => t.tag === "@deprecated"))
      .flatMap((subType) => [
        { prefix, subType, depth },
        ...(subType.kind === TypeDoc.ReflectionKind.Property
          ? flattenNestedTypes(
            subType.type!,
            `${prefix}.${subType.name}`,
            depth + 1,
          )
          : []),
        ...(subType.kind === TypeDoc.ReflectionKind.Accessor
          ? flattenNestedTypes(
            subType.getSignature?.type!,
            `${prefix}.${subType.name}`,
            depth + 1,
          )
          : []),
      ])
  }

  return []
}

//function renderNestedTypeList(
//  module: TypeDoc.DeclarationReflection,
//  prop: TypeDoc.DeclarationReflection | TypeDoc.SignatureReflection
//) {
//  return useNestedTypes(prop.type!, prop.name).map(
//    ({ depth, prefix, subType }) => {
//      const hasChildren =
//        subType.kind === TypeDoc.ReflectionKind.Property
//          ? useNestedTypes(subType.type!).length
//          : subType.kind === TypeDoc.ReflectionKind.Method
//            ? useNestedTypes(subType.signatures![0].type!).length
//            : useNestedTypes(subType.getSignature?.type!).length;
//      const type = hasChildren ? ` ${renderType(module, subType)}` : "";
//      const generateHash = (counter = 0): string => {
//        const hash =
//          `${prefix}.${subType.name}`
//            .toLowerCase()
//            .replace(/[^a-z0-9\.]/g, "")
//            .replace(/\./g, "-") + (counter > 0 ? `-${counter}` : "");
//        return Array.from(useLinkHashes(module).values()).includes(hash)
//          ? generateHash(counter + 1)
//          : hash;
//      };
//      const hash = generateHash();
//      useLinkHashes(module).set(subType, hash);
//      return `${" ".repeat(depth * 2)}- <p>[<code class="key">${renderName(
//        subType
//      )}</code>](#${hash})${type}</p>`;
//    }
//  );
//}

/********************/
/** Other functions */
/********************/

function saveFile(moduleName: string, content: any[]) {
  const filePath = path.join(OUTPUT_DIR, `${moduleName}.mdx`)
  if (!fs.existsSync(path.dirname(filePath)))
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content.flat(Infinity).join("\n"))
}

function configureLogger() {
  if (process.env.DEBUG) return
  console.debug = () => { }
}

async function build() {
  // Generate project reflection
  const app = await TypeDoc.Application.bootstrap({
    excludeInternal: true,
    // Ignore type errors caused by patching `Input<>`.
    skipErrorChecking: true,
    // Disable parsing @default tags as ```ts block code.
    jsDocCompatibility: {
      defaultTag: false,
    },

    entryPoints: [
      "../packages/openauth/src/adapter/apple.ts",
      "../packages/openauth/src/adapter/google.ts",
      "../packages/openauth/src/session.ts",
      "../packages/openauth/src/ui/theme.ts",
      "../packages/openauth/src/ui/code.tsx",
      "../packages/openauth/src/ui/select.tsx",
      "../packages/openauth/src/ui/password.tsx",
      "../packages/openauth/src/client.ts",
      "../packages/openauth/src/authorizer.ts",
      "../packages/openauth/src/storage/memory.ts",
      "../packages/openauth/src/storage/dynamo.ts",
      "../packages/openauth/src/storage/cloudflare.ts",
      "../packages/openauth/src/error.ts",
    ],
    tsconfig: "../packages/openauth/tsconfig.json",
  })

  const project = await app.convert()
  if (!project) throw new Error("Failed to convert project")

  // Generate JSON (generated for debugging purposes)
  await app.generateJson(project, "output/doc.json")

  return project
}

async function generate() { }
