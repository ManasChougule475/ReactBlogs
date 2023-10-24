//Blogging App using Hooks
import { useState,useRef,useEffect, useReducer} from "react";

function blogsReducer(state , action){
    switch(action.type){
        case "Add Blog":
            return [action.blog , ...state];
        case "Remove Blog":
            return state.filter((blog,index) => index!==action.index);
        case 'Update Blog':
            return state.map((blog, index) =>
                index === action.index ? { ...blog, content: action.new_content , title:action.new_title } : blog  
                // { ...blog, content: action.content }: If the index matches the action.index, it creates a new object that copies
                // all the properties from the current blog using the spread operator (...blog). Then, it updates the content property 
                // of this new object with the value provided in action.content. This effectively updates the content of the specific blog.
            );
        default:
            return [];
    }
}

export default function Blog(){

    // const [title,setTitle] = useState("");
    // const [content,setContent] = useState("");
    const [formData,setFormData]=useState({ title:"", content:"" }); // title & content gets updated at same time hence combined into single object
    // const [blogs, setBlogs] =  useState([]);
    const [blogs,dispatch] = useReducer(blogsReducer, []);

    const titleRef = useRef(null); // to bring focus on title of form

    // update :-
    const [updateIndex, setUpdateIndex] = useState(-1);  // Creating an array of refs for content fields will not work
    const [updatedTitle , setUpdatedTitle] = useState("")
    const [updatedContent, setUpdatedContent] = useState(""); // State to store the currently Updated content



    useEffect(()=>{  
        titleRef.current.focus(); // focus goes onto title fiels when app renders or reloads
    },[]);

    useEffect(()=>{
        if(blogs.length){
            blogs[0].title ? document.title = blogs[0].title : document.title = "Something"
        }else{
            document.title = "No Blogs!!";
        }
    },[blogs])

    function handleSubmit(e){
        e.preventDefault();

        if(updateIndex!==-1){
            alert('first update the blog you are trying to update then only you can add new blog')
            return; // in this case user is trying to update blog and at the same time he is adding new blog which will create problem
        }

        // setBlogs([{title: formData.title, content: formData.content}, ...blogs]);  
        dispatch({type:"Add Blog" , blog:{title: formData.title, content: formData.content} });

        setFormData({title: "" , content: ""})

        titleRef.current.focus(); // focus goes onto title field when app re-renders

        console.log(blogs); // prints previous state as dispatch(& setBlogs) is asynchronous fun. so blog is added inside blogs array after console.log() executes
    }

    function removeBlog(i){
        // setBlogs(blogs.filter((blog,index)=> i!==index));
        dispatch({type:"Remove Blog", index:i});
    }


    // code to update the blog :- 
    function updateBlog(i) {
        setUpdateIndex(i);
        setUpdatedTitle(blogs[i].title);
        setUpdatedContent(blogs[i].content); // Set the Updated content to blogs[i].content 
    }

    function handleContentChange(e) {
        if(e.target.className==="input title"){
            setUpdatedTitle(e.target.value);
        }else{
            setUpdatedContent(e.target.value);  // Set the updated content to e.target.value (i.e update value of updatedContent as user types) 
        }
    }
    

    function saveChanges(updatedContent,i){
        if(updatedContent){
            dispatch({ type: 'Update Blog', index: i, new_content: updatedContent , new_title: updatedTitle });
            setUpdateIndex(-1);
        }else{
            alert('Content is required for the update.');
            return;
        }
    }

    function cancleChanges(i){
        dispatch({ type: 'Update Blog', index: i, new_content: blogs[i].content , new_title: blogs[i].title });
        setUpdateIndex(-1);
    }


    return(
        <>
        <h1>Write a Blog!</h1>
        <div className="section">

        {/* Form for to write the blog */}
            <form onSubmit={handleSubmit}>
                <Row label="Title">
                        <input className="input title"
                                placeholder="Enter the Title of the Blog here.."
                                value={formData.title}
                                ref = {titleRef}
                                onChange = {(e) => setFormData({title : e.target.value , content: formData.content})}
                        />
                </Row >

                <Row label="Content">
                        <textarea className="input content"
                                placeholder="Content of the Blog goes here.."
                                value={formData.content}
                                onChange = {(e) => setFormData({title : formData.title , content : e.target.value})}
                                required //without content blog cannot exists 
                        />
                </Row >
         
                <button className = "btn">ADD</button>
            </form>
                     
        </div>

        <hr/>

        {/* Section where submitted blogs will be displayed */}
        <h2> Blogs </h2>
        {blogs.map((blog,i) => (
            <div className="blog" key={i}>

                <div className="blog-btn">
                    {updateIndex === i ? null: 
                    <button onClick={()=>updateBlog(i)} className="btn update">
                        Update
                    </button>}
                </div>

                {/* <h3>{blog.title}</h3> */}
                <textarea
                    className="input title"
                    placeholder="Enter title for blog"
                    value={updateIndex===i ? updatedTitle : blog.title}
                    onChange={(e) => handleContentChange(e)}
                    disabled={updateIndex !== i ? true : false}
                />
                <hr/>

                {/* <p>{blog.content}</p> */}
                <textarea
                    className="input content"
                    placeholder="Content of the Blog goes here.."
                    value={updateIndex === i ? updatedContent : blog.content}
                    onChange={(e) => handleContentChange(e)}
                    disabled={updateIndex !== i ? true : false}
                    required
                />

                <div className="blog-btn">
                    {updateIndex === i ? 
                    <>
                        <button onClick={()=>saveChanges(updatedContent,i)} className="btn update"  style={{marginRight: '10px' }}>
                            Save
                        </button>
                        <button onClick={()=>cancleChanges(i)} className="btn remove">
                            Cancle
                        </button>
                    </>
                    : 
                    <button onClick={()=>removeBlog(i)} className="btn remove">
                        Delete
                    </button>}
                </div>

            </div>
        ))}
        
        </>
        )
    }

//Row component to introduce a new row section in the form
function Row(props){
    const{label} = props;
    return(
        <>
        <label>{label}<br/></label>
        {props.children}
        <hr />
        </>
    )
}
