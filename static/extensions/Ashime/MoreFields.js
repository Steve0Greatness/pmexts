/**
 * This is a rewrite of the original More Fields
 * extension by 0znzw
 *
 * @author Steve0Greatness
 * @version 0.0
 * @license MIT
 */
(function(Scratch){

const self_id = "0znzwMoreFields";

const prefix_id = string => self_id + "_" + string;

function unique_id() {
  const soup = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var id;
  for (id = ""; id.length < 20; id += soup.charAt(Math.random() * soup.length));
  return id;
}

const deserialize_file = (unparsed_value) => {
  var method_start = 0;
  var method_end   = unparsed_value.indexOf("\n");
  var method       = unparsed_value.slice(method_start, method_end);

  var limit_start  = method_end + 1;
  var limit_end    = unparsed_value.indexOf("\n", method_end + 1);
  var limiter      = unparsed_value.slice(limit_start, limit_end);

  var data_start   = limit_end + 1;
  var data_end     = unparsed_value.length - 1;
  var data         = unparsed_value.slice(data_start, data_end);
  
  return { method, limiter, data };
}

const serialize_file = (method, limiter, data) => {
  return method + "\n" + limiter + "\n" + data;
};

const LoaderMethods = {
  DataURI: "dataURL",
  Text: "text"
};

const FILE_TEMPLATE = document.createElement("div");
FILE_TEMPLATE.style.display = "flex";
FILE_TEMPLATE.style.width = "100%"

const file_upload = document.createElement("input");
file_upload.setAttribute("type", "file");
file_upload.classList.add("file-upload");
file_upload.style.display = "none"

const file_upload_button = document.createElement("label");
file_upload_button.classList.add("file-button");
file_upload_button.textContent = "TEST";
file_upload_button.style.display = "block";
file_upload_button.style.flex = "1";

const FILE_MENU_BUTTON = document.createElement("button");
FILE_MENU_BUTTON.classList.add("menu-open");
FILE_MENU_BUTTON.textContent = "TEST2";
FILE_MENU_BUTTON.style.display = "block";
FILE_MENU_BUTTON.style.flex = "1";

const FILE_MENU = document.createElement("div");
FILE_MENU.classList.add("menu");
FILE_MENU.style.display = "none";
FILE_MENU.style.position = "absolute";
FILE_MENU.style.top = "100%";
FILE_MENU.style.left = "100%";
FILE_MENU.style.transform = `translateX(-50%) translateY(-50%)`;

FILE_TEMPLATE.append(file_upload_button, FILE_MENU_BUTTON, file_upload, FILE_MENU);

const TEXTAREA_INPUT_TEMPLATE = document.createElement("textarea");
const TEXTAREA_MIN_SIZING = [100, 32];

TEXTAREA_INPUT_TEMPLATE.style.width = TEXTAREA_MIN_SIZING[0] + "px";
TEXTAREA_INPUT_TEMPLATE.style.height = TEXTAREA_MIN_SIZING[1] + "px";

const TEXTAREA_PADDING = [15, 25];

const serialize_slider = (value, min, max) => value + "," + min + "," + max
const deserialize_slider = data => {
  let [value, min, max] = data.split(",");
  return {value, min, max};
}

const BOOLEAN_COLORS = [
  "#C90000", // false
  "#00C900", // true
];
const BOOLEAN_LABELS = [
  "F", // False
  "T", // True
];
const BOOLEAN_SWATCH_SPACING = 5;

const BOOLEAN_TEMPLATE = document.createElement("div");
BOOLEAN_TEMPLATE.style.position = "relative";
BOOLEAN_TEMPLATE.style.width = "25px";

const BOOLEAN_LABEL = document.createElement("span");
BOOLEAN_LABEL.classList.add("text");
BOOLEAN_LABEL.style.width = "25px";

const BOOLEAN_SWATCH = document.createElement("div");
BOOLEAN_SWATCH.classList.add("swatch");
BOOLEAN_SWATCH.style = `width:5px;height:5px;background-color:#ccc;position:absolute;`;

BOOLEAN_TEMPLATE.append(BOOLEAN_LABEL, BOOLEAN_SWATCH);

Scratch.gui.getBlockly().then(ScratchBlocks => {
  ScratchBlocks.FieldCustom.registerInput(
    prefix_id("FileInput"),
    FILE_TEMPLATE,
    function(input) {
      var { method, limiter, data } = deserialize_file(input.getValue());

      const file_upload = input.inputSource.querySelector(".file-upload");
      const options_open = input.inputSource.querySelector(".menu-open");
      const file_upload_button = input.inputSource.querySelector(".file-button");

      file_upload.id = prefix_id(unique_id() + "file-upload");
      file_upload.setAttribute("accept", limiter);

      file_upload_button.setAttribute("for", file_upload.id);

      file_upload.addEventListener("change", event => {
        const file = event.target.files[0];

        if (!file) {
          return; // No file uploaded; TODO: Handle
        }

        const reader = new FileReader();
        reader.onload = () => {
          data = reader.result;
          input.setValue(serialize_file(method, limiter, data));
        };
        switch (method) {
          case LoaderMethods.DataURI:
            reader.readAsDataURL(file);
            break;
          case LoaderMethods.Text:
            reader.readAsText(file);
            break;
          default:
            // No (valid) LoaderMethod. TODO: Handle... maybe
            break;
        }
      });
    },
    _ => {},
    _ => {},
    _ => {},
  );

  ScratchBlocks.FieldCustom.registerInput(
    prefix_id("TextareaInput"),
    TEXTAREA_INPUT_TEMPLATE,
    function(input) {
      const source = input.inputSource;
      const textarea = source.firstChild;
      textarea.addEventListener("change", event => {
        input.setValue(event.target.value);
      });

      let paused = false;
      new ResizeObserver(entries => {
        if (paused) return;
        for (const entry of entries) {
          paused = true;
          let {width, height} = entry.contentRect;
          width = Math.max(TEXTAREA_MIN_SIZING[0], width);
          height = Math.max(TEXTAREA_MIN_SIZING[1], height);
          input.size_.width = width + TEXTAREA_PADDING[0];
          input.size_.height = height + TEXTAREA_PADDING[1];

          input.inputSource.setAttribute("width", width);
          input.inputSource.setAttribute("height", height);
          if (input.sourceBlock_) input.sourceBlock_.render(true);
          requestAnimationFrame(() => { paused = false; });
        }
      }).observe(textarea);
    },
    _ => {},
    _ => {},
    _ => {}
  );

  ScratchBlocks.FieldCustom.registerInput(
    prefix_id("SnapBoolean"),
    BOOLEAN_TEMPLATE,
    function(input){
      const container = input.inputSource.firstChild;
      const text = container.querySelector(".text");
      const swatch = container.querySelector(".swatch");

      const update_appearance = function() {
        const value = Scratch.Cast.toNumber(input.getValue());

        swatch.style.left = (100 * value + (value ? 1 : -1) * BOOLEAN_SWATCH_SPACING).toString() + "%";
        
        container.style.background = BOOLEAN_COLORS[value];
        text.textContent = BOOLEAN_LABELS[value];

      };
      update_appearance();

      container.addEventListener("mousedown", () => {
        var value = Scratch.Cast.toNumber(input.getValue());
        input.setValue((value ? 0 : 1).toString()); // reverse it
        update_appearance();
        if (input._sourceBlock) input._sourceBlock.render(true);
      });
    },
    _ => {},
    _ => {},
    _ => {},
  );
});

const TEXT_DEFAULT = "Hello, World!"

const FILE_DEFAULT_VALUE = `${LoaderMethods.DataURI}\n*/*\ndata:text/plain;base64,${btoa(TEXT_DEFAULT)}`;
const SLIDER_DEFAULT = serialize_slider(10, 0, 20);

const create_field_name = opcode => "field_" + self_id + "_" + opcode;

const FILE_INPUT_FIELD_NAME = create_field_name("FileInput");
const TEXTAREA_FIELD_NAME = create_field_name("TextareaInput");
const SLIDER_FIELD_NAME = create_field_name("SliderInline");
const BOOLEAN_FIELD_NAME = create_field_name("SnapBoolean");

const FIELD_NAME_PREDONE = new Map([
  ["FileInput", FILE_INPUT_FIELD_NAME],
  ["TextareaInput", TEXTAREA_FIELD_NAME],
  ["SliderInline", SLIDER_FIELD_NAME],
  ["SnapBoolean", BOOLEAN_FIELD_NAME],
]);

class MoreFields {
  constructor(runtime) {
    this.runtime = runtime;
  }
  getInfo() {
    return {
      id: self_id,
      name: "More Fields",
      blocks: [
        {
          opcode: "FileInput",
          text: "[" + FILE_INPUT_FIELD_NAME + "]",
          blockType: Scratch.BlockType.REPORTER,
          arguments: {
            [FILE_INPUT_FIELD_NAME]: {
              type: Scratch.ArgumentType.CUSTOM,
              id: prefix_id("FileInput"),
              defaultValue: FILE_DEFAULT_VALUE
            }
          }
        },
        {
          opcode: "file",
          text: "file [FILE]",
          blockType: Scratch.BlockType.REPORTER,
          arguments: {
            FILE: { fillIn: "FileInput" }
          }
        },
        {
          opcode: "TextareaInput",
          text: "[" + TEXTAREA_FIELD_NAME + "]",
          blockType: Scratch.BlockType.REPORTER,
          arguments: {
            [TEXTAREA_FIELD_NAME]: {
              type: Scratch.ArgumentType.CUSTOM,
              id: prefix_id("TextareaInput"),
              defaultValue: TEXT_DEFAULT
            }
          }
        },
        {
          opcode: "textarea",
          text: "textarea [TEXT]",
          blockType: Scratch.BlockType.REPORTER,
          arguments: {
            TEXT: { fillIn: "TextareaInput" }
          }
        },
        /*{
          opcode: "SliderInline",
          text: "[" + SLIDER_FIELD_NAME + "]",
          blockType: Scratch.BlockType.REPORTER,
          arguments: {
            [SLIDER_FIELD_NAME]: {
              type: "custom",
              id: prefix_id("SliderInline"),
              defaultValue: SLIDER_DEFAULT
            }
          }
        },
        {
          opcode: "sliderInline",
          text: "slider [NUM]",
          blockType: Scratch.BlockType.REPORTER,
          arguments: {
            NUM: { fillIn: "SliderInline" }
          }
        },*/
        /*{
          opcode: "textareaInline",
          blockType: Scratch.BlockType.REPORTER,
        },*/
        {
          opcode: "SnapBoolean",
          text: "[" + BOOLEAN_FIELD_NAME + "]",
          blockType: Scratch.BlockType.BOOLEAN,
          arguments: {
            [BOOLEAN_FIELD_NAME]: {
              type: "custom",
              id: prefix_id("SnapBoolean"),
              defaultValue: "1",
            }
          }
        },
        {
          opcode: "snapBool",
          text: "[BOOL]",
          blockType: Scratch.BlockType.BOOLEAN,
          arguments: {
            BOOL: { fillIn: "SnapBoolean" }
          }
        },
        /*{
          opcode: "date",
          blockType: Scratch.BlockType.REPORTER,
        },
        {
          opcode: "hiddenString",
          blockType: Scratch.BlockType.REPORTER,
        },*/
      ]
    }
  }

  FileInput(args) {
    return deserialize_file(Scratch.Cast.toString(args[FILE_INPUT_FIELD_NAME])).data;
  }
  file(args) {
    return args.FILE;
  }

  TextareaInput(args) {
    return args[TEXTAREA_FIELD_NAME];
  }
  textarea(args) {
    return args.TEXT;
  }

  SnapBoolean(args) {
    return args[BOOLEAN_FIELD_NAME];
  }
  snapBool(args) {
    return args.BOOL;
  }
}

Scratch.extensions.register(new MoreFields());

})(Scratch);
