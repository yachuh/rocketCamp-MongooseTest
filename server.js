const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('./models/post');
const errorHandle = require('./errorHandle');

//載入環境變數
dotenv.config({path:'./config.env'});
const DB = process.env.DATABASE.replace(
    '<password>',
    process.env.DATABASE_PASSWORD
);


// 連接資料庫
mongoose.connect(DB)
    .then(() => {
        console.log('資料庫連接成功')
    })
    .catch((err) => {
        console.log(err)
    }); 


// Post.create(
// 	{
//         name: "Ya Chu",
//         tags: ["電影","心情"],
//         type: "group",
//         image: "",
//         content: "Aloha this is test content",
//         likes: 0,
//         comments: 0
//     }
// )
//  .then(()=> console.log('新增資料成功！'))
//  .catch( err => console.log(err));


const requestListener = async(req, res)=>{
    const headers = {
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
        'Content-Type': 'application/json'
    };

    let body = "";
    req.on('data', chunk=>{
        body+=chunk;
    })

    if (req.url === "/posts" && req.method === "GET"){
        const posts = await Post.find(); // .find() => returns a promise
        res.writeHead(200, headers);
        res.write(JSON.stringify({ // JSON.stringify() 將物件轉為 JSON 字串
            "status":"success",
            posts
        }));
        res.end();
    } else if (req.url === "/posts" && req.method === "POST"){
        req.on('end', async () => {
            try{
                const data = JSON.parse(body);
                if(data.content !== undefined){
                    const newPost = await Post.create(
                        {
                            name: data.name,
                            content: data.content
                        }
                    );
                    res.writeHead(200,headers);
                    res.write(JSON.stringify({
                        "status":"success",
                        "data": newPost
                    }));
                    res.end();
                } else {
                    errorHandle(res);
                }
            }
            catch (error){
                errorHandle(res);
            }
        });
    } else if (req.url === "/posts" && req.method === "DELETE"){
        try{
            await Post.deleteMany({});
            res.writeHead(200,headers);
            res.write(JSON.stringify({
                "status":"success",
                "message":"刪除成功"
            }))
            res.end();
        } catch {
            errorHandle(res);
        }
    } else if (req.url.startsWith("/posts/") && req.method === "DELETE"){
        try{
            const id = req.url.split('/').pop(); // 將網址以 / 切割，獲得 array, 取最後一個值
            if( id !== undefined){
                await Post.findByIdAndDelete(id);
                res.writeHead(200,headers);
                res.write(JSON.stringify({
                    "status": "success",
                    "data": null,
                }));
                res.end();
            } else {
                errorHandle(res);
            }
        } catch(error){
            errorHandle(res);
        }
    } else if (req.url.startsWith("/posts/") && req.method === "PATCH"){
        req.on('end', async()=>{
            try{
                const id = req.url.split('/').pop();
                const posts = await Post.find();
                const data = JSON.parse(body);
                const index = posts.findIndex(element => element.id === id);
                await Post.findByIdAndUpdate(id,{
                    "name": data.name,
                    "content": data.content
                });
                res.writeHead(200, headers);
                res.write(JSON.stringify({ // JSON.stringify() 將物件轉為 JSON 字串
                    "status":"success",
                    "data":posts[index]
                }));
                res.end();
            } catch {
                errorHandle(res);
            }
        })
    } else if(req.method === "OPTIONS"){
        res.writeHead(200,headers);
        res.end();
    }
    else {
        res.writeHead(404, headers);
        res.write(JSON.stringify({
            "status":"false",
            "message":"無此網站路由"
        }));
    }
}

const server = http.createServer(requestListener);
server.listen(process.env.PORT);