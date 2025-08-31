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

const options_menu = document.createElement("button");
options_menu.classList.add("menu-open");
options_menu.textContent = "TEST2";
options_menu.style.display = "block";
options_menu.style.flex = "1";

FILE_TEMPLATE.append(file_upload_button, options_menu, file_upload);

const TEXTAREA_INPUT_TEMPLATE = document.createElement("textarea");
TEXTAREA_INPUT_TEMPLATE.rows = "5";
TEXTAREA_INPUT_TEMPLATE.cols = "5";

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
      input.inputSource.firstChild.addEventListener("change", event => {
        input.setValue(event.target.value);
      });
    },
    _ => {},
    _ => {},
    _ => {}
  );
});

const FILE_DEFAULT_VALUE = `${LoaderMethods.DataURI}\n*/*\ndata:text/plain;base64,${btoa("Hello, World!")}`;

const create_field_name = opcode => "field_" + self_id + "_" + opcode;

const FILE_INPUT_FIELD_NAME = create_field_name("FileInput");
const TEXTAREA_FIELD_NAME = create_field_name("TextareaInput");
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
              defaultValue: "Hello, World!"
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
          opcode: "textareaInline",
          blockType: Scratch.BlockType.REPORTER,
        },
        {
          opcode: "snapBool",
          blockType: Scratch.BlockType.BOOLEAN,
        },
        {
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
}

Scratch.extensions.register(new MoreFields());

})(Scratch);
