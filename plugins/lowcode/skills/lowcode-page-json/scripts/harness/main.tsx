import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { type Data } from '@puckeditor/core';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';

import { Router } from '../../../../../apps/lowcode/src/app/router';
import { JsonView } from '../../../../../apps/lowcode/src/pages/json-view/JsonView';
import { AuthProvider } from '../../../../../apps/lowcode/src/runtime';
import { theme } from '../../../../../shared/ui-v2/src/index';
import pageData from 'page-json';

declare const __JSON_MODE__: boolean;
declare const __ROUTE__: string;
declare const __TOKEN__: string;

createRoot(document.getElementById('root') as HTMLElement).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AuthProvider auth={{ ensureToken: async () => __TOKEN__, token: __TOKEN__ }}>
      <MemoryRouter initialEntries={[__ROUTE__]}>
        {__JSON_MODE__ ? <JsonView data={pageData as unknown as Data} /> : <Router />}
      </MemoryRouter>
    </AuthProvider>
  </ThemeProvider>
);
