# NutriFlow - Plataforma SaaS para Nutricionistas

Uma plataforma completa e moderna para gestão de consultórios de nutrição, desenvolvida com Next.js 14, TypeScript, Tailwind CSS e Firebase.

## 🚀 Recursos Principais

- **Autenticação Segura**: Login com email/senha e Google OAuth
- **Gestão de Pacientes**: CRUD completo com dados antropométricos e anamnese
- **Agenda Inteligente**: Sistema de agendamento com lembretes
- **Planos Alimentares**: Criação e gestão de dietas personalizadas
- **Chat em Tempo Real**: Comunicação direta com pacientes
- **Controle Financeiro**: Gestão de receitas e despesas
- **Dashboard Analytics**: Visualização de métricas e evolução

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta no Firebase
- Conta no Vercel (para deploy)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/nutriflow.git
cd nutriflow
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o Firebase:
   - Acesse o [Firebase Console](https://console.firebase.google.com)
   - Crie um novo projeto ou use o existente
   - Ative Authentication (Email/Password e Google)
   - Ative Firestore Database
   - Ative Storage
   - As credenciais já estão configuradas em `lib/firebase/config.ts`

4. Configure as regras de segurança do Firestore:
   - Copie o conteúdo de `firestore.rules`
   - Cole no console do Firebase em Firestore > Rules

5. Execute o projeto localmente:
```bash
npm run dev
```

Acesse http://localhost:3000

## 🚀 Deploy no Vercel

1. Instale o Vercel CLI:
```bash
npm i -g vercel
```

2. Faça o deploy:
```bash
vercel
```

3. Siga as instruções do CLI:
   - Conecte à sua conta Vercel
   - Configure o projeto
   - O deploy será feito automaticamente

4. Configure as variáveis de ambiente no Vercel Dashboard:
   - Todas as variáveis já estão hardcoded no arquivo de config
   - Para produção, considere usar variáveis de ambiente

## 🏗️ Estrutura do Projeto

```
nutriflow/
├── app/                    # App Router do Next.js
│   ├── (auth)/            # Páginas de autenticação
│   ├── (dashboard)/       # Área logada
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── ui/               # Componentes de UI base
│   └── layout/           # Componentes de layout
├── lib/                   # Utilitários e configurações
│   ├── firebase/         # Configuração do Firebase
│   ├── hooks/            # React Hooks customizados
│   ├── stores/           # Zustand stores
│   └── types/            # TypeScript types
├── public/               # Arquivos estáticos
└── firestore.rules       # Regras de segurança
```

## 🔐 Segurança

- Autenticação obrigatória para todas as rotas protegidas
- Regras de segurança no Firestore limitam acesso aos dados
- Cada nutricionista só pode acessar seus próprios dados
- Sanitização de inputs e validação com Zod

## 📱 Funcionalidades Detalhadas

### Dashboard
- Visão geral com métricas principais
- Gráficos de evolução
- Próximas consultas
- Pacientes recentes

### Gestão de Pacientes
- Cadastro completo com anamnese
- Dados antropométricos
- Histórico de evolução
- Integração com WhatsApp

### Agenda
- Calendário visual
- Agendamento de consultas
- Lembretes automáticos
- Suporte a teleconsultas

### Planos Alimentares
- Editor visual de refeições
- Cálculo automático de macros
- Exportação em PDF
- Banco de alimentos

### Chat
- Mensagens em tempo real
- Envio de imagens
- Histórico de conversas
- Notificações

### Financeiro
- Registro de receitas
- Controle de pagamentos
- Relatórios mensais
- Dashboard financeiro

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **UI Components**: Radix UI, Shadcn/UI
- **State Management**: Zustand
- **Forms**: React Hook Form, Zod
- **Charts**: Recharts
- **Calendar**: React Big Calendar

## 📄 Licença

Este projeto está sob licença proprietária. Todos os direitos reservados.

## 🤝 Suporte

Para suporte, entre em contato através do email: suporte@nutriflow.com.br

## 🔄 Atualizações

O projeto está configurado para CI/CD automático no Vercel. Cada push para a branch main dispara um novo deploy.

---

Desenvolvido com 💚 para nutricionistas modernos