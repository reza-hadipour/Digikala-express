async function getPaymentLink(amount,description = `Buy from ${process.env.APP_NAME}`) {
    const zarinpalPayUrl = process.env.ZARINPAL_PAY_URL;
    const zarinpalPayReqUrl = process.env.ZARINPAL_REQUEST_URL;

    const merchant_id = process.env.ZARINPAL_MERCHANT_ID;
    const callback_url = `http://localhost:${process.env.APP_PORT}/pay/verify`;

    const payBodyRequest = {
        merchant_id,
        callback_url,
        amount,
        description
    }

    const response = await fetch(zarinpalPayReqUrl,{
        method: 'POST',
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(payBodyRequest)
    }).then(async (res) => {
        return await res.json();
    })

    let result = {...response?.data}
    result['paymentUrl'] = zarinpalPayUrl + "/" + response?.data.authority;
    result['error'] = response?.errors;
    
    return result;

}

async function verifyTransaction(authority,amount) {
    const merchant_id = process.env.ZARINPAL_MERCHANT_ID;
    const zarinpalVerifyUrl = process.env.ZARINPAL_VERIFY_URL;

    const verificationBody = {
        merchant_id,
        amount,
        authority
    }

    const response = await fetch(zarinpalVerifyUrl,{
        method: 'POST',
        headers: {
            "content-type":"application/json"
        },
        body: JSON.stringify(verificationBody)
    }).then(async (res)=>{
        return await res.json();
    })

    let result = {...response?.data};
    result['errors'] = response?.errors;

    return result;
}

module.exports = {
    getPaymentLink,
    verifyTransaction
}