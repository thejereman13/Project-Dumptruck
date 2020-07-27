import { h, JSX } from "preact";
import Button from "preact-material-components/Button";
import TextField from "preact-material-components/TextField";
import * as style from "./style.css";
import { useState } from "preact/hooks";
import { route } from "preact-router";

function Home(): JSX.Element {
    const [roomName, setRoomName] = useState("");

    const updateRoomName = (
        e: JSX.TargetedEvent<HTMLInputElement, Event>
    ): void => {
        setRoomName(e.currentTarget.value);
    };
    const joinRoom = (): void => {
        if (roomName) {
            route(`/room/${roomName}`);
        }
    };

    return (
        <div class={style.home}>
            <h1>Home</h1>
            <TextField
                label="Room ID"
                value={roomName}
                onInput={updateRoomName}
            />
            <Button raised onClick={joinRoom}>Join Room</Button>
        </div>
    );
};

export default Home;
