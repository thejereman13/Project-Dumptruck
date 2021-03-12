
/**
 * Sleeps for a given number of miliseconds
 * @param duration number of miliseconds before the function returns
 */
export async function sleep(duration: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}
