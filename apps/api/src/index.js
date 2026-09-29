import express from "express";
import cors from "cors";
const user = {
    id: 1,
    name: "John Doe",
    email: "a@a.com",
};
const PORT = process.env.PORT || 8000;
const app = express();
app.use(cors());
app.use(express.json());
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});
app.get("/health", (req, res) => {
    res.json({
        message: "Server is healthy",
        status: "OK",
    });
});
app.get("/", (req, res) => {
    res.send("Hello World!");
});
//# sourceMappingURL=index.js.map