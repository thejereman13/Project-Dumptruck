import { createResource, createSignal, For } from "solid-js";
import { DotLoader } from "./LoadingAnimations";

export interface Comment {
    postId: number;
    id: number;
    name: string;
    email: string;
    body: string;
}

async function sleep(ms: number) {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

async function fetchComments(): Promise<Comment[] | null> {
    await sleep(80);
    try {
        const res = await fetch("https://jsonplaceholder.typicode.com/comments");
        const json = await res.json();
        if (Array.isArray(json)) return shuffle(json);
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
}

function CommentCard(props: { comment: Comment }) {
    return (
        <div class="card card-body bg-base-200 shadow-xl m-4 rounded-lg ">
            <div class="tooltip" data-tip={`Post ${props.comment.postId}`}>
                <h2 class="card-title text-primary">{props.comment.name}</h2>
            </div>
            <h4 class="text-secondary">{props.comment.email}</h4>
            <p>{props.comment.body}</p>
        </div>
    );
}

export function CommentList() {
    const [list, { refetch }] = createResource(fetchComments);

    return (
        <div>
            <button class="btn btn-primary" onClick={refetch}>
                Refetch
            </button>
            <For each={list()} fallback={DotLoader}>
                {(item) => <CommentCard comment={item} />}
            </For>
        </div>
    );
}
