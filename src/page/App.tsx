import * as  React from 'react';
import { useState } from '../../packages/react-18.2.0/packages/react/src/ReactHooks';

const App = () => {
    const [count, setCount] = useState(1);
    const increase = () => {
        setCount(count + 1);
    }
    return <div>
        {count}
        <br />
        <button onClick={increase}>数字加1</button>
    </div>
}


export default App;