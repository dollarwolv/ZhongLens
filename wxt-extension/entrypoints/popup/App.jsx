import cropImg from "@/assets/crop.svg";

function App() {
  return (
    <div className="flex w-64 flex-col p-2">
      <div className="flex w-full flex-row items-center justify-between">
        <img src="/icon/128.png" alt="ZhongLens logo" className="w-18" />
        <h1 className="text-2xl">ZhongLens</h1>
      </div>
      <div className="flex flex-row">
        <button>
          <img src={cropImg} alt="crop" />
        </button>
      </div>
    </div>
  );
}

export default App;
