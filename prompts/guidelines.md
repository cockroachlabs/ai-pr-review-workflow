# General AI PR Review Guidelines

## **Response Format**

You **must** output your findings in JSON format for inline code review comments.

For each issue found, provide:
- **path**: The file path relative to repository root
- **line**: The line number where the issue occurs
- **body**: A clear explanation of the issue (what, why, and suggested fix)

**JSON Schema:**
```json
{
  "comments": [
    {
      "path": "path/to/file.js",
      "line": 42,
      "body": "**Issue**: [Brief description]\n\n**Why**: [Explanation]\n\n**Suggestion**: [How to fix]"
    }
  ]
}
```

If you find NO issues, output:
```json
{
  "comments": []
}
```

**Important**:
- Use `gh pr diff` to see the PR changes and identify exact file paths and line numbers
- Only comment on lines that are part of the PR diff (new or modified lines)
- Be precise with line numbers - they must match the new file content
- Format your comment body in markdown

---

## **Output Requirement**

After your analysis, output a valid JSON object as shown above. Do NOT include additional text before or after. This JSON will be parsed to create inline PR review comments.

---