export function generateCard() {
    let colors = ['blue', 'red', 'green', 'yellow'];
    let values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', 'R', 'S', '+4', 'W'];
    let color = 'black';
    let value = values[Math.floor(Math.random() * values.length)];
    if (value !== '+4' && value !== 'W') {
        colors[Math.floor(Math.random() * colors.length)]
    }
    return { color, value };
}
