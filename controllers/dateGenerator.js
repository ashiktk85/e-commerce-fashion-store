const generateDate = () => {
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1; // Get real month name
    const year = currentDate.getFullYear();
    const formateDate = `${day}-${month}-${year}`;

    return formateDate;
}


module.exports=generateDate