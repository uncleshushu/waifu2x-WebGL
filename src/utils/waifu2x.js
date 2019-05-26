import * as tf from '@tensorflow/tfjs';


const MODEL_INFO_MAP = {
    // "FSRCNN": {
    //     dir_name: "fsrcnn_model",
    //     margin_size: 3,
    //     upscale_firspt: true,
    //     // upscale_first: bicubic_webgl,
    // },
    "VGG-7": {
        dir_name: "waifu2x_vgg_7_scale2.0x_model_valid_padding_model",
        // dir_name: "waifu2x_vgg_7_scale2.0x_symmetric_padding_model",
        patch_size: 64,
        margin_size: 7,
        padding_method: "VALID",
        upscale_first: true,
        // pre_upscale_method: bicubic_webgl,
    },
    "UpConv-7": {
        // dir_name: "waifu2x_upconv_7_noise_1_scale2.0x_symmetric_padding_model",
        // dir_name: "waifu2x_upconv_7_noise1_scale2.0x_valid_padding_model",
        dir_name: "waifu2x_upconv_7_noise1_scale2.0x_same_padding_model",
        patch_size: 128,
        margin_size: 6,
        padding_method: "SAME",
        upscale_first: false,
    },
};


async function enlarge(original_image,
    output_canvas_ctx,
    model,
    model_info
    ){

    /* eslint-disable no-console */
    console.log(`memory used before processing: ${tf.memory().numBytes / 1024} KiB`);
    
    const margin_size = model_info.margin_size;
    const patch_size = model_info.patch_size;
    const padding_method = model_info.padding_method;
    const upscale_first = model_info.upscale_first;

    // reshape to: [1, h, w, 3] and normalize
    const input = tf.tidy(
        () => tf.browser.fromPixels(original_image)   // int32, 3 channels
                .expandDims()
                .asType('float32')
                .div(255.0)
    );

    const [b, h, w, c] = input.shape;
    const [padded_h, padded_w] = [h + 2 * margin_size, w + 2 * margin_size];

    // pad the input image tensor
    const padded_input = tf.tidy(() => {
        const h_padded_input = tf.concat([tf.tile(tf.slice(input, [0, 0, 0, 0], [b, 1, w, c]), [1, margin_size, 1, 1]),
                                          input, 
                                          tf.tile(tf.slice(input, [0, h-1, 0, 0], [b, 1, w, c]), [1, margin_size, 1, 1])
                                         ], 
                                         1);
        return tf.concat([tf.tile(tf.slice(h_padded_input, [0, 0, 0, 0], [b, padded_h, 1, c]), [1, 1, margin_size, 1]),
                          h_padded_input, 
                          tf.tile(tf.slice(h_padded_input, [0, 0, w-1, 0], [b, padded_h, 1, c]), [1, 1, margin_size, 1])
                         ],
                         2);
    });
    
    // split the padded image into overlapped patches
    const overlapped_patch_size = patch_size + 2 * margin_size;
    const overlapped_patches = new Array(Math.ceil(h / patch_size)).fill(0)
                                .map(() => new Array(Math.ceil(w / patch_size)).fill(0))
                                .map((r, i, rows) => 
                                        r.map((v, j, row) =>
                                            tf.slice(padded_input, 
                                                     [0, i * patch_size, j * patch_size, 0],
                                                     [b,
                                                      i < rows.length - 1 ? overlapped_patch_size : padded_h - i * patch_size,
                                                      j < row.length - 1 ? overlapped_patch_size : padded_w - j * patch_size,
                                                      c])));


    for(let i = 0; i < overlapped_patches.length; i++){
        let row = overlapped_patches[i];
        for(let j = 0; j < row.length; j++){
            const overlapped_patch = row[j];
            const enlarged_patch_pixels = tf.tidy(() => {        
                const enlarged_overlapped_patch_pixels = model.predict(overlapped_patch).squeeze();
                let [eop_h, eop_w, eop_c] = enlarged_overlapped_patch_pixels.shape;
                switch(padding_method){
                    case "VALID":
                        if(upscale_first)
                            return enlarged_overlapped_patch_pixels
                                    .slice([margin_size, margin_size, 0], 
                                            [eop_h - 2 * margin_size, eop_w - 2 * margin_size, eop_c]);
                        else
                            return enlarged_overlapped_patch_pixels
                                .slice([0, 0, 0], 
                                        [eop_h, eop_w, eop_c]);        
                    case "SAME":
                        return enlarged_overlapped_patch_pixels
                                .slice([2 * margin_size, 2 * margin_size, 0], 
                                        [eop_h - 4 * margin_size, eop_w - 4 * margin_size, eop_c]);
                }               
            });
            // eslint-disable-next-line
            const [enlarged_patch_h, enlarged_patch_w, c] = enlarged_patch_pixels.shape;
            const enlarged_patch_bytes = await tf.browser.toPixels(enlarged_patch_pixels);
            enlarged_patch_pixels.dispose();
            overlapped_patch.dispose();

            const enlarged_patch_image_data = new ImageData(enlarged_patch_bytes,
                                                            enlarged_patch_w,
                                                            enlarged_patch_h);
            output_canvas_ctx.putImageData(enlarged_patch_image_data, 2 * j * patch_size, 2 * i * patch_size);
        }
    }

    tf.dispose(padded_input);
    tf.dispose(input);

    /* eslint-disable no-console */
    console.log(`memory used after processing: ${tf.memory().numBytes / 1024} KiB`);
}

// async function enlarge_split_overlapped(original_image,
//     output_canvas_ctx,
//     model,
//     margin_size,
//     patch_size = 128) {
        
//     const input_pixels = tf.browser.fromPixels(original_image);  // int32, 3 channels

//     // reshape to: [1, h, w, 3]
//     const input_tensor = tf.tidy(() =>
//         input_pixels
//             .expandDims()
//             .asType('float32')
//             .div(255.0));
//     tf.dispose(input_pixels);

//     output_canvas_ctx.globalAlpha = 1.0;

//     for (let i = 0, h = input_tensor.shape[1]; i < h; i += patch_size) {
//         const patch_h = h - i < patch_size ? h - i : patch_size;

//         const margined_in_patch_top = i - margin_size < 0 ?
//             i : i - margin_size;

//         const margined_in_patch_bottom = i + patch_h + margin_size > h ?
//             i + patch_h : i + patch_h + margin_size;

//         const margined_in_patch_h = margined_in_patch_bottom - margined_in_patch_top;

//         for (let j = 0, w = input_tensor.shape[2]; j < w; j += patch_size) {
//             const patch_w = w - j < patch_size ? w - j : patch_size;

//             const margined_in_patch_left = j - margin_size < 0 ?
//                 j : j - margin_size;

//             const margined_in_patch_right = j + patch_w + margin_size > w ?
//                 j + patch_w : j + patch_w + margin_size;

//             const margined_in_patch_w = margined_in_patch_right - margined_in_patch_left;

//             const margined_in_patch_tensor = input_tensor.slice(
//                 [0,
//                     margined_in_patch_top,
//                     margined_in_patch_left,
//                     0],
//                 [input_tensor.shape[0],
//                     margined_in_patch_h,
//                     margined_in_patch_w,
//                 input_tensor.shape[3]]);

//             // out: dtype: float32
//             const margined_out_patch_tensor = model.predict(margined_in_patch_tensor);
//             tf.dispose(margined_in_patch_tensor);

//             // discard the `batch` dimension
//             const margined_out_patch_pixels = margined_out_patch_tensor.squeeze();
//             tf.dispose(margined_out_patch_tensor);

//             // crop the output
//             const out_patch_top = margined_in_patch_top == i ?
//                 0 : 2 * margin_size;
//             const out_patch_bottom = margined_in_patch_bottom == i + patch_h ?
//                 margined_out_patch_pixels.shape[0]
//                 : margined_out_patch_pixels.shape[0] - 2 * margin_size;

//             const out_patch_left = margined_in_patch_left == j ?
//                 0 : 2 * margin_size;
//             const out_patch_right = margined_in_patch_right == j + patch_w ?
//                 margined_out_patch_pixels.shape[1]
//                 : margined_out_patch_pixels.shape[1] - 2 * margin_size;

//             const out_patch_w = out_patch_right - out_patch_left;
//             const out_patch_h = out_patch_bottom - out_patch_top;

//             const out_patch_pixels = margined_out_patch_pixels.slice(
//                 [out_patch_top,
//                     out_patch_left,
//                     0],
//                 [out_patch_h,
//                     out_patch_w,
//                     3]);
//             tf.dispose(margined_out_patch_pixels);

//             // draw it to canvas
//             const out_patch_flat_array = await tf.browser.toPixels(out_patch_pixels);
//             tf.dispose(out_patch_pixels);

//             const out_patch_image_data = new ImageData(out_patch_flat_array,
//                 out_patch_w,
//                 out_patch_h);

//             output_canvas_ctx.putImageData(out_patch_image_data, 2 * j, 2 * i);
//         }

//         const mem_info = tf.memory();
//         /* eslint-disable no-console */
//         console.log(`in-loop memory used: ${mem_info.numBytes / 1024} KiB`);
//     }

//     tf.dispose(input_tensor);

//     const mem_info = tf.memory();
//     /* eslint-disable no-console */
//     console.log(`memory used: ${mem_info.numBytes / 1024} KiB`);
// }


// function enlarge_split_overlapped_no_async(original_image,
//     output_canvas_ctx,
//     model,
//     margin_size,
//     patch_size = 128) {

//     const input_pixels = tf.browser.fromPixels(original_image);  // int32, 3 channels

//     // reshape to: [1, h, w, 3]
//     const input_tensor = tf.tidy(() =>
//         input_pixels
//             .expandDims()
//             .asType('float32')
//             .div(255.0));
//     tf.dispose(input_pixels);

//     output_canvas_ctx.globalAlpha = 1.0;

//     for (let i = 0, h = input_tensor.shape[1]; i < h; i += patch_size) {
//         const patch_h = h - i < patch_size ? h - i : patch_size;

//         const margined_in_patch_top = i - margin_size < 0 ?
//             i : i - margin_size;

//         const margined_in_patch_bottom = i + patch_h + margin_size > h ?
//             i + patch_h : i + patch_h + margin_size;

//         const margined_in_patch_h = margined_in_patch_bottom - margined_in_patch_top;

//         for (let j = 0, w = input_tensor.shape[2]; j < w; j += patch_size) {
//             const patch_w = w - j < patch_size ? w - j : patch_size;

//             const margined_in_patch_left = j - margin_size < 0 ?
//                 j : j - margin_size;

//             const margined_in_patch_right = j + patch_w + margin_size > w ?
//                 j + patch_w : j + patch_w + margin_size;

//             const margined_in_patch_w = margined_in_patch_right - margined_in_patch_left;

//             const margined_in_patch_tensor = input_tensor.slice(
//                 [0,
//                     margined_in_patch_top,
//                     margined_in_patch_left,
//                     0],
//                 [input_tensor.shape[0],
//                     margined_in_patch_h,
//                     margined_in_patch_w,
//                 input_tensor.shape[3]]);

//             // out: dtype: float32
//             const margined_out_patch_tensor = model.predict(margined_in_patch_tensor);
//             tf.dispose(margined_in_patch_tensor);

//             // discard the `batch` dimension
//             const margined_out_patch_pixels = margined_out_patch_tensor.squeeze();
//             tf.dispose(margined_out_patch_tensor);

//             // crop the output
//             const out_patch_top = margined_in_patch_top == i ?
//                 0 : 2 * margin_size;
//             const out_patch_bottom = margined_in_patch_bottom == i + patch_h ?
//                 margined_out_patch_pixels.shape[0]
//                 : margined_out_patch_pixels.shape[0] - 2 * margin_size;

//             const out_patch_left = margined_in_patch_left == j ?
//                 0 : 2 * margin_size;
//             const out_patch_right = margined_in_patch_right == j + patch_w ?
//                 margined_out_patch_pixels.shape[1]
//                 : margined_out_patch_pixels.shape[1] - 2 * margin_size;

//             const out_patch_w = out_patch_right - out_patch_left;
//             const out_patch_h = out_patch_bottom - out_patch_top;

//             const out_patch_pixels = margined_out_patch_pixels.slice(
//                 [out_patch_top,
//                     out_patch_left,
//                     0],
//                 [out_patch_h,
//                     out_patch_w,
//                     3]);
//             tf.dispose(margined_out_patch_pixels);

//             // draw it to canvas
//             tf.browser.toPixels(out_patch_pixels).then((out_patch_flat_array) => {
//                 tf.dispose(out_patch_pixels);
//                 const out_patch_image_data = new ImageData(out_patch_flat_array,
//                     out_patch_w,
//                     out_patch_h);

//                 output_canvas_ctx.putImageData(out_patch_image_data, 2 * j, 2 * i);
//             });
//         }

//         const mem_info = tf.memory();
//         /* eslint-disable no-console */
//         console.log(`in-loop memory used: ${mem_info.numBytes / 1024} KiB`);
//     }

//     tf.dispose(input_tensor);

//     const mem_info = tf.memory();
//     /* eslint-disable no-console */
//     console.log(`memory used: ${mem_info.numBytes / 1024} KiB`);
// }

async function tf_time(func, ...args) {
    return await tf.time(() => func(...args));
}

export default {
    MODEL_INFO_MAP,
    enlarge,
    // enlarge_split_overlapped,
    // enlarge_split_overlapped_no_async,
    async loadModel(modelPath) {
        return await tf.loadGraphModel(modelPath);
    },
    tf_time,
};