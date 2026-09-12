# AyakaChats：模型最大输出 Token 配置优化

## 背景

当前模型配置中的 `MaxResponseTokens` 是必填整数，并且要求：

```text
0 < MaxResponseTokens < ContextWindow
```

但部分模型（例如 Grok 4.6）只有明确的 **Context Window**，官方并没有单独规定固定的最大文本输出 Token 上限。

因此目前只能人为填写 `65536` 等数值，不能准确描述模型能力。

另外，当前实际请求逻辑已经支持 `MaxOutputTokens` 为空：只有配置了值时才会向上游发送 `max_tokens` / `max_completion_tokens`。因此模型元数据也应该允许表达“无独立输出上限”。

## 修改目标

将模型级的：

```text
MaxResponseTokens
```

改为**可选字段**。

语义定义：

```text
null
= 上游没有已知/固定的独立最大输出 Token 限制

有值
= 模型官方声明或管理员配置的最大输出 Token 数
```

例如 Grok 4.6：

```text
ContextWindow     = 500000
MaxResponseTokens = null
```

## 需要修改

### 1. 数据库 / 后端 Model

将相关字段从：

```csharp
int MaxResponseTokens
```

改成：

```csharp
int? MaxResponseTokens
```

包括 `ModelSnapshot`、`UpdateModelRequest`、`AdminModelDto` 等，并增加 EF Migration，将数据库列调整为 nullable。

当前 `UpdateModelRequest` 和 `AdminModelDto` 都还是必填 `int`。

### 2. 后端校验

Chat / Responses / Messages 模型允许：

```text
MaxResponseTokens = null
```

只有存在值时才校验：

```text
MaxResponseTokens > 0
MaxResponseTokens < ContextWindow
```

删除当前“Chat 模型必须填写 MaxResponseTokens”的限制。现有强制校验位于 `ValidateChatResponseTokensAttribute`。

### 3. Thinking Budget 联动

当前规则：

```text
MaxThinkingBudget < MaxResponseTokens
```

修改为：

```text
MaxResponseTokens != null:
    MaxThinkingBudget < MaxResponseTokens

MaxResponseTokens == null:
    MaxThinkingBudget < ContextWindow
```

同时仍要求：

```text
MaxThinkingBudget > 0
```

### 4. 前端类型与表单

将：

```ts
maxResponseTokens: number;
```

改成：

```ts
maxResponseTokens: number | null;
```

Admin DTO / Update DTO 都同步修改。当前前端类型仍为必填 `number`。

注意处理空字符串：

```text
"" => null
```

不要使用简单的：

```ts
z.coerce.number()
```

否则空字符串可能被转换成 `0`。

UI 文案建议改成：

```text
最大输出 Token 数（可选）
```

placeholder：

```text
留空表示无独立限制
```

### 5. 请求逻辑

保持现有逻辑：

```text
MaxOutputTokens 有值
→ 发送 max_tokens / max_completion_tokens

MaxOutputTokens 为空
→ 不向上游发送对应字段
```

现有 `ChatCompletionService` 已经是这种行为，不需要额外人为生成一个默认 Token 上限。

## 顺带检查

当前 Image Generation 似乎复用了 `MaxResponseTokens` 表示“最大图片批量数量”。

如果改动成本可控，建议进一步拆分为：

```csharp
int? MaxOutputTokens
int? MaxImageBatchSize
```

避免一个字段同时承担“文本 Token 上限”和“图片 batch size”两个不同领域概念。

## 验收标准

修改完成后应满足：

```text
Grok 4.6:
ContextWindow = 500000
MaxResponseTokens = null
→ 可以保存
→ 发起请求时不发送 max_tokens

其他有明确输出上限的模型:
ContextWindow = 200000
MaxResponseTokens = 64000
→ 可以保存
→ 请求正常携带对应最大输出参数

MaxResponseTokens >= ContextWindow
→ 校验失败
```

**优先完成 nullable 改造；字段重命名为 `MaxOutputTokens`、拆分 `MaxImageBatchSize` 可以视影响范围决定是否顺手完成。**
