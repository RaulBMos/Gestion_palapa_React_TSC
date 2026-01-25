# 📚 Recursos & Referencias - Auditoría CasaGestión

**Documento de Apoyo para la Auditoría**  
**Contiene**: Links, librerías, y recursos educativos  
**Actualizado**: Enero 25, 2026

---

## 🛠️ Librerías Recomendadas

### Testing
```json
{
  "vitest": "^1.0.0",           // Testing framework
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "@vitest/ui": "^1.0.0",       // UI dashboard
  "playwright": "^1.40.0",      // E2E testing
  "@playwright/test": "^1.40.0"
}
```

### Type Safety & Validation
```json
{
  "zod": "^3.22.0",             // Runtime validation
  "typescript": "~5.8.2",       // Ya tienes
  "@types/node": "^22.14.0"     // Ya tienes
}
```

### Error Tracking
```json
{
  "@sentry/react": "^7.80.0",   // Error monitoring
  "@sentry/tracing": "^7.80.0"
}
```

### Performance
```json
{
  "vite-plugin-compression": "^0.5.1",  // Gzip/Brotli
  "web-vitals": "^3.5.0"                // Métricas
}
```

### Development Tools
```json
{
  "husky": "^8.0.0",            // Pre-commit hooks
  "lint-staged": "^15.0.0",     // Run tests on commit
  "tsx": "^4.0.0"               // TypeScript runner
}
```

---

## 📖 Documentación Oficial

### React 19
- **Official Docs**: https://react.dev
- **React 19 Features**: https://react.dev/blog/2024/12/05/react-19
- **Hooks API**: https://react.dev/reference/react
- **Server Components**: https://react.dev/reference/react-server-functions

### TypeScript
- **Official Handbook**: https://www.typescriptlang.org/docs/
- **Advanced Types**: https://www.typescriptlang.org/docs/handbook/advanced-types.html
- **Performance Tips**: https://www.typescriptlang.org/docs/handbook/performance.html

### Vite
- **Official Guide**: https://vitejs.dev/guide/
- **PWA Plugin**: https://vite-pwa-org.netlify.app/
- **Performance**: https://vitejs.dev/guide/ssr.html

### Google Gemini API
- **Official Docs**: https://ai.google.dev/docs
- **Rate Limiting**: https://ai.google.dev/docs/quota_pricing
- **Error Handling**: https://ai.google.dev/docs/error_handling

### Tailwind CSS v4
- **Official Docs**: https://tailwindcss.com/docs
- **Migration Guide**: https://tailwindcss.com/docs/upgrade-guide
- **Performance**: https://tailwindcss.com/docs/optimizing-for-production

---

## 🏗️ Architecture Patterns

### Clean Architecture
- **Uncle Bob Blog**: https://blog.cleancoder.com/
- **Book**: "Clean Code" & "Clean Architecture"
- **Aplicado a React**: https://github.com/ryanmcdermott/clean-code-javascript

### Atomic Design
- **Official Site**: https://bradfrost.com/blog/post/atomic-web-design/
- **React Implementation**: https://www.smashingmagazine.com/2023/08/delightful-button-design-part-1/
- **Component Library**: https://storybook.js.org/

### State Management Patterns
- **Context API**: https://react.dev/reference/react/useContext
- **Zustand Alternative**: https://github.com/pmndrs/zustand
- **Redux if Needed**: https://redux.js.org/

---

## 🧪 Testing Resources

### Vitest
- **Official Docs**: https://vitest.dev/guide/
- **Basics**: https://vitest.dev/guide/why.html
- **API**: https://vitest.dev/api/

### Testing Library
- **React Testing**: https://testing-library.com/docs/react-testing-library/intro/
- **Best Practices**: https://testing-library.com/docs/queries/about
- **Common Mistakes**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

### Playwright
- **Official Docs**: https://playwright.dev/docs/intro
- **Best Practices**: https://playwright.dev/docs/best-practices
- **Debugging**: https://playwright.dev/docs/debug

### Test Coverage
- **Coverage Goals**: https://testing-library.com/docs/react-testing-library/setup#using-vitest
- **Meaningful Coverage**: https://kentcdodds.com/blog/how-to-know-what-to-test
- **Istanbul**: https://istanbul.js.org/

---

## 🔒 Security Resources

### API Key Management
- **12 Factor App**: https://12factor.net/
- **Environment Variables**: https://vitejs.dev/guide/env-and-mode.html
- **Backend Secrets**: https://github.com/motdotla/dotenv

### Frontend Security
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **CSP Headers**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- **XSS Prevention**: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

### Data Encryption
- **crypto-js**: https://github.com/brix/crypto-js
- **TweetNaCl.js**: https://tweetnacl.js.org/
- **libsodium**: https://download.libsodium.org/doc/

---

## 📊 Performance & Monitoring

### Performance Auditing
- **Google Lighthouse**: https://developers.google.com/web/tools/lighthouse
- **Core Web Vitals**: https://web.dev/vitals/
- **Pagespeed Insights**: https://pagespeed.web.dev/

### Bundle Analysis
- **source-map-explorer**: https://github.com/danvk/source-map-explorer
- **rollup-plugin-visualizer**: https://github.com/doesdev/rollup-plugin-visualizer
- **Bundle Buddy**: https://www.bundle-buddy.com/

### Error Tracking
- **Sentry**: https://sentry.io/for/javascript/
- **LogRocket**: https://logrocket.com/
- **Rollbar**: https://rollbar.com/

### Analytics
- **Plausible**: https://plausible.io/
- **Fathom Analytics**: https://usefathom.com/
- **Google Analytics**: https://analytics.google.com/

---

## 🚀 CI/CD & Deployment

### GitHub Actions
- **Official Docs**: https://docs.github.com/en/actions
- **Workflows**: https://github.com/actions
- **React Testing Template**: https://github.com/actions/starter-workflows

### Deployment Platforms
- **Vercel**: https://vercel.com/docs
- **Netlify**: https://docs.netlify.com/
- **Railway**: https://railway.app/docs
- **Fly.io**: https://fly.io/docs/

### Environment Management
- **Secrets in CI/CD**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Environment Variables**: https://docs.vercel.com/projects/environment-variables

---

## 🎓 Educational Resources

### React Best Practices
- **Kent C. Dodds Blog**: https://kentcdodds.com/blog
- **React Patterns**: https://react.dev/learn/render-and-commit
- **Performance**: https://react.dev/blog/2022/03/29/react-v18

### TypeScript Advanced
- **Type Challenges**: https://github.com/type-challenges/type-challenges
- **Effective TypeScript**: https://effectivetypescript.com/
- **Advanced Types**: https://www.totaltypescript.com/

### Software Engineering
- **System Design**: https://www.designgurus.io/
- **SOLID Principles**: https://en.wikipedia.org/wiki/SOLID
- **Design Patterns**: https://refactoring.guru/design-patterns

---

## 📚 Books Recommended

### Architecture & Design
- "Clean Code" - Robert C. Martin
- "Clean Architecture" - Robert C. Martin
- "Refactoring" - Martin Fowler
- "Design Patterns" - Gang of Four

### React & JavaScript
- "Learning React" - Eve Porcello & Alex Banks
- "Effective TypeScript" - Dan Vanderkam
- "You Don't Know JS Yet" - Kyle Simpson

### Testing
- "The Art of Software Testing" - Glenford Myers
- "Working Effectively with Legacy Code" - Michael Feathers

---

## 🛠️ Tools & IDEs

### Recommended IDE Extensions (VS Code)
```
ES7+ React/Redux/React-Native snippets
Prettier - Code Formatter
ESLint
Vitest UI
Thunder Client (API testing)
REST Client
GitLens
```

### Install
```bash
# From VS Code Extensions marketplace search for:
dbaeumer.vscode-eslint
esbenp.prettier-vscode
firsttris.vscode-jest-runner
vitest.explorer
```

---

## 🔗 Community & Support

### React Community
- **React Discord**: https://discord.com/invite/react
- **React Twitter**: https://twitter.com/reactjs
- **Dev.to React Tag**: https://dev.to/t/react

### TypeScript Community
- **TypeScript Discord**: https://discord.gg/typescript
- **StackOverflow**: https://stackoverflow.com/questions/tagged/typescript

### Testing Community
- **Testing JavaScript**: https://testingjavascript.com/
- **Testing Library Discord**: https://discord.gg/testing-library
- **Vitest Discussions**: https://github.com/vitest-dev/vitest/discussions

---

## 📊 Benchmark & Comparison

### Frontend Framework Comparison
- **State of JavaScript 2024**: https://2024.stateofjs.com/
- **JS Framework Benchmark**: https://krausest.github.io/js-framework-benchmark/

### Testing Tool Comparison
- **Vitest vs Jest**: https://vitest.dev/guide/why.html
- **Playwright vs Cypress**: https://reflect.run/articles/playwright-vs-cypress-comparison/

---

## 🎯 Quick Command Reference

### Development
```bash
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
```

### Testing
```bash
npm run test            # Run all tests once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
npm run test:ui        # Open Vitest UI
```

### Code Quality
```bash
npm run lint           # Run ESLint
npm run format         # Format with Prettier
```

### Type Checking
```bash
npx tsc --noEmit       # Check types without emitting
```

---

## 🔐 Security Checklist

- [ ] No API keys en source code
- [ ] Environment variables documentadas
- [ ] .env en .gitignore
- [ ] Dependencies actualizadas (`npm audit`)
- [ ] CORS configurado correctamente
- [ ] CSP headers implementados
- [ ] HTTPS en producción
- [ ] Rate limiting implementado
- [ ] Input validation (Zod)
- [ ] XSS prevention
- [ ] CSRF protection si aplica

---

## 📱 Browser Support

### Target Browsers (Vite Default)
- Chrome/Edge: >= 89
- Firefox: >= 78
- Safari: >= 14

### Testing Browsers
```bash
# Playwright supports
- Chromium
- Firefox
- WebKit (Safari)
- Mobile Chrome/Safari
```

---

## 🌐 APIs & External Services

### Google Gemini AI
- **Pricing**: https://ai.google.dev/pricing
- **Models**: https://ai.google.dev/docs/models/gemini
- **Rate Limits**: https://ai.google.dev/docs/quota_pricing
- **Error Codes**: https://ai.google.dev/docs/error_handling

### Other AI Alternatives (si Gemini falla)
- **OpenAI**: https://openai.com/api/
- **Anthropic Claude**: https://www.anthropic.com/
- **Hugging Face**: https://huggingface.co/
- **Azure OpenAI**: https://azure.microsoft.com/en-us/products/ai-services/openai-service/

---

## 📞 Getting Help

### When Stuck
1. Google/ChatGPT con el error exacto
2. Stack Overflow with detailed question
3. GitHub Discussions for library issues
4. Community Discord channels
5. Official documentation

### Asking Good Questions
- Include minimal reproducible example (MRE)
- Show error message completo
- Describe what intentaste
- Show código relevante
- Specify versions (Node, npm, React, etc.)

---

## 🎯 Next Steps After Reading

1. **Bookmark this document** - Referencia durante implementación
2. **Check librerías versions** - Usar versions especificadas
3. **Join communities** - React, TypeScript, Testing
4. **Subscribe to newsletters** - React Status, JavaScript Weekly
5. **Star GitHub repos** - Vitest, Testing Library, Playwright

---

## 📝 Notes

Este documento se actualizará conforme:
- Nuevas versiones de librerías
- Cambios en mejor prácticas
- Nuevos recursos educativos

**Última actualización**: Enero 25, 2026

---

> "Learning is a journey, not a destination." - Unknown

**Buena suerte con tu auditoría e implementación!** 🚀

