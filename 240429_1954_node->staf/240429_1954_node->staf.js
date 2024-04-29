//240429_1957_node : 함수 호출 구문 수정 필요 //필요없는 npm install 추리기 작업 필요
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const ffmpeg = require('fluent-ffmpeg');

app.use(express.static('public'));
app.use(express.json());

function generateRandomString(length) {
    const characters = 'AlmnBopqrCstDuvwExyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, 'images');
        fs.ensureDirSync(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const randomFileName = generateRandomString(30);
        cb(null, randomFileName + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/upload-and-convert', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No image was uploaded.');
    }
    const gender = req.body.gender;
    const imageFilePath = req.file.path;
    const videoFilePath = path.join(__dirname, 'images', `${req.file.filename}.mp4`);

    try {
        await convertImageToVideo(imageFilePath, videoFilePath);

        const formData = new FormData();
        formData.append('video', fs.createReadStream(videoFilePath));
        formData.append('fileName', req.file.filename);
        formData.append('gender', gender);

        await axios.post('http://localhost:xxxx/upload', formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        res.status(200).send('Video created and uploaded successfully.');
    } catch (error) {
        console.error('Failed to convert image to video:', error);
        res.status(500).send('Failed to process image.');
    }
});

function convertImageToVideo(imagePath, videoPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(imagePath)
            .outputOptions(['-vf', 'scale=1920:1080', '-t 1', '-r 1'])
            .output(videoPath)
            .on('end', () => resolve(videoPath))
            .on('error', (err) => reject(err))
            .run();
    });
}


// Multer 설정: 업로드된 파일을 'uploads' 폴더에 저장
const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads');
        // 'uploads' 폴더가 없으면 생성
        fs.ensureDirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // 원본 파일 이름 유지
        cb(null, file.originalname);
    }
});

const upload2 = multer({ storage: storage2 });




// ZIP 파일을 받는 엔드포인트
app.post('/receive_zip', upload2.single('file'), (req, res) => {
    if (req.file) {
        console.log('Received file:', req.file.originalname);
        res.json({ message: 'File received successfully' });
    } else {
        res.status(400).send('No file received');
    }
});


const PORT = process.env.PORT || 7283;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
