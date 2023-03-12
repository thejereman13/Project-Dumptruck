import { Route, Routes } from '@solidjs/router';
import type { Component } from 'solid-js';
import { Header } from './components/Header';
import { RenderAllNotifications } from './components/Notification';
import { Home } from './Home';
import { Login, useAuthenticatedUser } from './Login';
import { Room } from './Room';

const App: Component = () => {

  useAuthenticatedUser();
  return (
    <div id="app">
      <Header />
      <RenderAllNotifications />
      <Routes>
          <Route path="/" component={Home} />
          <Route path="/profile" component={Login} />
          <Route path="/login" component={Login} />
          <Route path="room/:roomID" component={Room} />
      </Routes>
  </div>
  );
};

export default App;
