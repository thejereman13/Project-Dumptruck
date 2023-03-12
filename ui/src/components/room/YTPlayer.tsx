import { createEffect, createSignal, JSX, onCleanup, onMount } from "solid-js";
import { siteUser } from "../../Login";
import { videoIDFromURL } from "../../utils/YoutubeTypes";
import { RegisterNotification } from "../Notification";

export interface YouTubeVideoProps {
    className: string;
    id: string;
    playerMount: () => void;
    playerError: (id: string) => void;
    playerReady: () => void;
    seekTo: (time: number) => void;
}

enum SynchronizationState {
    Reset,
    Playing,
    Paused,
    Finished
}

export function YoutubeConstructor() {
    let YTLoaded = false;
    let id: string | undefined = undefined;
    let player: YT.Player | undefined;
    let synchronizationState = SynchronizationState.Reset;
    let seekTimer: NodeJS.Timeout | null = null;
    
    let lastTimestamp = 0;
    let lastTimestampCheck = 0;
    let lastSeek = 0;

    const [isPlayerMounted, setPlayerMounted] = createSignal(false);
    
    const setVolume = (level: number): number => {
        if (!player || !isPlayerMounted()) return 0;
        const val = Math.max(0, Math.min(level, 100));
        player.setVolume(val);
        return val;
    }
    const getVolume = (): number => {
        if (!player || !isPlayerMounted()) return 0;
        return player.getVolume();
    }

    const synchronizeYoutube = (videoTime: number, playing: boolean): void => {
        if (!player || !isPlayerMounted()) return;
        // console.log("Sync", videoTime, playing, new Date().toUTCString());
        switch (synchronizationState) {
            case SynchronizationState.Reset:
                if (playing) {
                    synchronizationState = SynchronizationState.Playing;
                    synchronizeYoutube(videoTime, playing);
                } else {
                    player.stopVideo();
                }
                break;
            case SynchronizationState.Playing:
                if (Math.abs(player.getCurrentTime() - videoTime) > 1) {
                    player.seekTo(videoTime, true);
                    lastTimestamp = videoTime;
                }
                if (player.getPlayerState() === 0) {
                    synchronizationState = SynchronizationState.Finished;
                } else if (player.getPlayerState() !== 1) {
                    player.playVideo();
                    player.playVideo();
                }
                if (!playing) {
                    synchronizationState = SynchronizationState.Paused;
                    synchronizeYoutube(videoTime, playing);
                }
                break;
            case SynchronizationState.Paused:
                if (Math.abs(player.getCurrentTime() - videoTime) > 1) {
                    player.seekTo(videoTime, true);
                    lastTimestamp = videoTime;
                }
                if (player.getPlayerState() !== 2) {
                    player.pauseVideo();
                }
                if (playing) {
                    synchronizationState = SynchronizationState.Playing;
                    synchronizeYoutube(videoTime, playing);
                }
                break;
            case SynchronizationState.Finished:
                if (playing) {
                    synchronizationState = SynchronizationState.Playing;
                    synchronizeYoutube(videoTime, playing);
                }
                break;
        }
    }

    const component = function YouTubeVideo(props: YouTubeVideoProps): JSX.Element {
        const seekCheck = () => {
            if (!YTLoaded || !isPlayerMounted() || !player) return;
            const currTime = player.getCurrentTime();
            const currTimeFlat = Math.floor(currTime);
            const currCheck = new Date().getTime();
            // only try skipping if the last seekCheck was run recently (to avoid delayed callbacks)
            // and skipping more than 2.5s forwards or backwards
            // and not skipping to the same timestamp twice in a row
            if (lastTimestamp > 0 && currCheck - lastTimestampCheck < 1500 && Math.abs(currTime - lastTimestamp) > 2.5 && currTimeFlat !== lastSeek) {
                console.log("Player Seek to ", currTime, " from ", lastTimestamp);
                props.seekTo(currTimeFlat);
                player.seekTo(currTimeFlat, true);
                lastSeek = currTimeFlat;
            }

            lastTimestamp = currTime;
            lastTimestampCheck = currCheck;
        };

        createEffect(() => {
            if (props.id !== id) {
                const oldEl = document.getElementById(`youtube-player-${id}`);
                if (oldEl) oldEl?.parentElement?.removeChild(oldEl);
                if (window.YT) loadVideo();
            }
        });

        onCleanup(() => {
            if (seekTimer)
                clearInterval(seekTimer);
        });

        const scriptLoaded = () => {
            YTLoaded = true;
            loadVideo();
        };

        const loadVideo = () => {
            id = props.id;
            if (!YTLoaded) return;

            if (!isPlayerMounted() && id) {
                player = new window.YT.Player(`youtube-player`, {
                    host: "https://www.youtube-nocookie.com",
                    videoId: id,
                    events: {
                        onReady: onPlayerReady,
                        onError: (e): void => {
                            const vidID = videoIDFromURL(e.target.getVideoUrl());
                            RegisterNotification("Youtube Player Encountered Error", "error");
                            if (vidID) props.playerError(vidID);
                        }
                        // onStateChange: (e): void => onPlayerStateChange(e.data)
                    },
                    playerVars: {
                        fs: 1,
                        disablekb: 1,
                        playsinline: 1,
                        origin: "https://www.youtube.com"
                    }
                });
            } else {
                if (!id) {
                    player?.destroy();
                    setPlayerMounted(false);
                } else {
                    lastTimestamp = 0;
                    lastSeek = 0;
                    player?.loadVideoById(id);
                    player?.pauseVideo();
                }
            }
        };


        const onPlayerReady = () => {
            setPlayerMounted(true);
            lastTimestamp = 0;
            lastTimestampCheck = new Date().getTime();
            lastSeek = 0;
            props.playerMount();
        };

        onMount(() => {
            // On mount, check to see if the API script is already loaded
            if (!window.YT) {
                // If not, load the script asynchronously TS-ignore
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";

                // onYouTubeIframeAPIReady will load the video after the script is loaded
                // @ts-ignore
                window.onYouTubeIframeAPIReady = scriptLoaded;

                const firstScriptTag = document.getElementsByTagName("script")[0];
                firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
            } else {
                // If script is already there, load the video directly
                YTLoaded = true;
                loadVideo();
            }
            seekTimer = setInterval(seekCheck, 250);
        });

        return (
            <div class={props.className}>
                <div id={`youtube-player`} />
            </div>
        );
    }

    return {
        component,
        setVolume,
        getVolume,
        isPlayerMounted,
        synchronizeYoutube,
    };
}
