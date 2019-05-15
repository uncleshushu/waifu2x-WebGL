import * as tf from '@tensorflow/tfjs';

const MODEL_INFO_MAP = {
    // "FSRCNN": {
    //     dir_name: "fsrcnn_model",
    //     margin_size: 3,
    //     upscale_first: true,
    //     // upscale_first: bicubic_webgl,
    // },
    "VGG-7": {
        dir_name: "waifu2x_vgg_7_scale2.0x_symmetric_padding_model",
        patch_size: 64,
        margin_size: 7,
        upscale_first: false,   // embedded as first op
        // upscale_method: bicubic_webgl,
    },
    "UpConv-7": {
        dir_name: "waifu2x_upconv_7_noise_1_scale2.0x_symmetric_padding_model",
        patch_size: 128,
        margin_size: 6,
        upscale_first: false,
    },
};

async function enlarge_split_overlapped(original_image,
    output_canvas_ctx,
    model,
    margin_size,
    patch_size = 128) {
        
    const input_pixels = tf.browser.fromPixels(original_image);  // int32, 3 channels

    // reshape to: [1, h, w, 3]
    const input_tensor = tf.tidy(() =>
        input_pixels
            .expandDims()
            .asType('float32')
            .div(255.0));
    tf.dispose(input_pixels);

    output_canvas_ctx.globalAlpha = 1.0;

    for (let i = 0, h = input_tensor.shape[1]; i < h; i += patch_size) {
        const patch_h = h - i < patch_size ? h - i : patch_size;

        const margined_in_patch_top = i - margin_size < 0 ?
            i : i - margin_size;

        const margined_in_patch_bottom = i + patch_h + margin_size > h ?
            i + patch_h : i + patch_h + margin_size;

        const margined_in_patch_h = margined_in_patch_bottom - margined_in_patch_top;

        for (let j = 0, w = input_tensor.shape[2]; j < w; j += patch_size) {
            const patch_w = w - j < patch_size ? w - j : patch_size;

            const margined_in_patch_left = j - margin_size < 0 ?
                j : j - margin_size;

            const margined_in_patch_right = j + patch_w + margin_size > w ?
                j + patch_w : j + patch_w + margin_size;

            const margined_in_patch_w = margined_in_patch_right - margined_in_patch_left;

            const margined_in_patch_tensor = input_tensor.slice(
                [0,
                    margined_in_patch_top,
                    margined_in_patch_left,
                    0],
                [input_tensor.shape[0],
                    margined_in_patch_h,
                    margined_in_patch_w,
                input_tensor.shape[3]]);

            // out: dtype: float32
            const margined_out_patch_tensor = model.predict(margined_in_patch_tensor);
            tf.dispose(margined_in_patch_tensor);

            // discard the `batch` dimension
            const margined_out_patch_pixels = margined_out_patch_tensor.squeeze();
            tf.dispose(margined_out_patch_tensor);

            // crop the output
            const out_patch_top = margined_in_patch_top == i ?
                0 : 2 * margin_size;
            const out_patch_bottom = margined_in_patch_bottom == i + patch_h ?
                margined_out_patch_pixels.shape[0]
                : margined_out_patch_pixels.shape[0] - 2 * margin_size;

            const out_patch_left = margined_in_patch_left == j ?
                0 : 2 * margin_size;
            const out_patch_right = margined_in_patch_right == j + patch_w ?
                margined_out_patch_pixels.shape[1]
                : margined_out_patch_pixels.shape[1] - 2 * margin_size;

            const out_patch_w = out_patch_right - out_patch_left;
            const out_patch_h = out_patch_bottom - out_patch_top;

            const out_patch_pixels = margined_out_patch_pixels.slice(
                [out_patch_top,
                    out_patch_left,
                    0],
                [out_patch_h,
                    out_patch_w,
                    3]);
            tf.dispose(margined_out_patch_pixels);

            // draw it to canvas
            const out_patch_flat_array = await tf.browser.toPixels(out_patch_pixels);
            tf.dispose(out_patch_pixels);

            const out_patch_image_data = new ImageData(out_patch_flat_array,
                out_patch_w,
                out_patch_h);

            output_canvas_ctx.putImageData(out_patch_image_data, 2 * j, 2 * i);
        }

        const mem_info = tf.memory();
        /* eslint-disable no-console */
        console.log(`in-loop memory used: ${mem_info.numBytes / 1024} KiB`);
    }

    tf.dispose(input_tensor);

    const mem_info = tf.memory();
    /* eslint-disable no-console */
    console.log(`memory used: ${mem_info.numBytes / 1024} KiB`);
}


function enlarge_split_overlapped_no_async(original_image,
    output_canvas_ctx,
    model,
    margin_size,
    patch_size = 128) {

    const input_pixels = tf.browser.fromPixels(original_image);  // int32, 3 channels

    // reshape to: [1, h, w, 3]
    const input_tensor = tf.tidy(() =>
        input_pixels
            .expandDims()
            .asType('float32')
            .div(255.0));
    tf.dispose(input_pixels);

    output_canvas_ctx.globalAlpha = 1.0;

    for (let i = 0, h = input_tensor.shape[1]; i < h; i += patch_size) {
        const patch_h = h - i < patch_size ? h - i : patch_size;

        const margined_in_patch_top = i - margin_size < 0 ?
            i : i - margin_size;

        const margined_in_patch_bottom = i + patch_h + margin_size > h ?
            i + patch_h : i + patch_h + margin_size;

        const margined_in_patch_h = margined_in_patch_bottom - margined_in_patch_top;

        for (let j = 0, w = input_tensor.shape[2]; j < w; j += patch_size) {
            const patch_w = w - j < patch_size ? w - j : patch_size;

            const margined_in_patch_left = j - margin_size < 0 ?
                j : j - margin_size;

            const margined_in_patch_right = j + patch_w + margin_size > w ?
                j + patch_w : j + patch_w + margin_size;

            const margined_in_patch_w = margined_in_patch_right - margined_in_patch_left;

            const margined_in_patch_tensor = input_tensor.slice(
                [0,
                    margined_in_patch_top,
                    margined_in_patch_left,
                    0],
                [input_tensor.shape[0],
                    margined_in_patch_h,
                    margined_in_patch_w,
                input_tensor.shape[3]]);

            // out: dtype: float32
            const margined_out_patch_tensor = model.predict(margined_in_patch_tensor);
            tf.dispose(margined_in_patch_tensor);

            // discard the `batch` dimension
            const margined_out_patch_pixels = margined_out_patch_tensor.squeeze();
            tf.dispose(margined_out_patch_tensor);

            // crop the output
            const out_patch_top = margined_in_patch_top == i ?
                0 : 2 * margin_size;
            const out_patch_bottom = margined_in_patch_bottom == i + patch_h ?
                margined_out_patch_pixels.shape[0]
                : margined_out_patch_pixels.shape[0] - 2 * margin_size;

            const out_patch_left = margined_in_patch_left == j ?
                0 : 2 * margin_size;
            const out_patch_right = margined_in_patch_right == j + patch_w ?
                margined_out_patch_pixels.shape[1]
                : margined_out_patch_pixels.shape[1] - 2 * margin_size;

            const out_patch_w = out_patch_right - out_patch_left;
            const out_patch_h = out_patch_bottom - out_patch_top;

            const out_patch_pixels = margined_out_patch_pixels.slice(
                [out_patch_top,
                    out_patch_left,
                    0],
                [out_patch_h,
                    out_patch_w,
                    3]);
            tf.dispose(margined_out_patch_pixels);

            // draw it to canvas
            tf.browser.toPixels(out_patch_pixels).then((out_patch_flat_array) => {
                tf.dispose(out_patch_pixels);
                const out_patch_image_data = new ImageData(out_patch_flat_array,
                    out_patch_w,
                    out_patch_h);

                output_canvas_ctx.putImageData(out_patch_image_data, 2 * j, 2 * i);
            });
        }

        const mem_info = tf.memory();
        /* eslint-disable no-console */
        console.log(`in-loop memory used: ${mem_info.numBytes / 1024} KiB`);
    }

    tf.dispose(input_tensor);

    const mem_info = tf.memory();
    /* eslint-disable no-console */
    console.log(`memory used: ${mem_info.numBytes / 1024} KiB`);
}

async function tf_time(func, ...args) {
    return await tf.time(() => func(...args));
}

export default {
    MODEL_INFO_MAP,
    enlarge_split_overlapped,
    enlarge_split_overlapped_no_async,
    async loadModel(modelPath) {
        return await tf.loadGraphModel(modelPath);
    },
    tf_time,
};