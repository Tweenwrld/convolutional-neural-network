export const getColor = (value: number): [number, number, number] => {
    // Orange-white-blue colormap
    // value ranges from -1 to 1
    // -1 = orange (255, 127, 14)
    //  0 = white (255, 255, 255)
    // +1 = blue (31, 119, 180)
    
    const orange: [number, number, number] = [255, 127, 14];
    const white: [number, number, number] = [255, 255, 255];
    const blue: [number, number, number] = [31, 119, 180];
    
    let r, g, b;
    
    if (value >= 0) {
        // Interpolate from white to blue
        r = white[0] + (blue[0] - white[0]) * value;
        g = white[1] + (blue[1] - white[1]) * value;
        b = white[2] + (blue[2] - white[2]) * value;
    } else {
        // Interpolate from white to orange (value is negative)
        const t = -value;
        r = white[0] + (orange[0] - white[0]) * t;
        g = white[1] + (orange[1] - white[1]) * t;
        b = white[2] + (orange[2] - white[2]) * t;
    }

    return [Math.round(r), Math.round(g), Math.round(b)];
}