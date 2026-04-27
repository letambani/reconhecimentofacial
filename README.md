# Reconhecimento facial

Aplicação web para consulta e cadastro rápido com **reconhecimento facial** no navegador, usando modelos locais/CDN do **face-api.js**.

---

## Documentação

**SISTEMA DE RECONHECIMENTO FACIAL**

| | |
| --- | --- |
| **Projeto** | Reconhecimento facial |
| **Base técnica** | React + Vite + face-api.js |
| **Data de elaboração** | Abril de 2026 |

**Alunos**

- Letícia Tambani  
- Marcelo Marques de Souza  
- Rithiély Schmitt  

---

## Funcionalidades (resumo)

- Captura pela **câmera** (frontal / traseira quando disponível) e **envio de imagem** (JPG, PNG, WEBP).
- Detecção de múltiplos rostos, correspondência com base em memória e **cadastro rápido** de pessoa desconhecida.
- Interface pensada para uso institucional (PMSC — contexto do cabeçalho da aplicação).

## Requisitos

- Node.js 18+ (recomendado)
- Navegador com suporte a **WebRTC** (`getUserMedia`) para a câmera

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço indicado no terminal (por padrão **http://localhost:8080**).

Outros scripts:

| Comando | Descrição |
| --- | --- |
| `npm run build` | Build de produção (inclui passos para GitHub Pages no script) |
| `npm run preview` | Servir a pasta `dist` após o build |
| `npm run lint` | ESLint |
| `npm test` | Testes com Vitest |

## Estrutura principal

- `src/pages/Index.tsx` — fluxo da tela principal  
- `src/components/CameraCapture.tsx` — câmera, upload e pré-visualização  
- `src/hooks/useFaceRecognition.ts` — carregamento dos modelos e matching  
- `public/models` — pesos do face-api.js (com fallback para CDN oficial)

## Licença / uso

Projeto acadêmico. Uso restrito conforme contexto institucional definido na aplicação.
