import * as React from 'react';
import { render } from 'react-dom';
import { createRoot } from 'react-dom/client';
import App from './page/App';


// render(<App />, document.getElementById('root'));
/**
 *  Concurrent Mode 并发模式
 */
createRoot(document.getElementById('root')).render(<App />);