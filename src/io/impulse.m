pkg load signal

[src,fs]=audioread(argv);
[reca,fs]=audioread('reca.L.wav');
[recb,fs]=audioread('recb.L.wav');
[recc,fs]=audioread('recc.L.wav');


function imp = impulseResponse(src,rec)
	hbw = 5000;
	skip =144000
	bw = 2*hbw;
	[R,lag]=xcorr(src,rec);
	[maxval ind] = max(abs(R)(length(rec)-hbw:length(rec)+hbw));
	o = hbw-ind;
	src=src(o+skip:end-1);
	rec=rec(1+skip:length(rec)-o);
	imp = real((ifft(fft(rec)./fft(src))));
endfunction

impa = impulseResponse(src,reca);
impb = impulseResponse(src,recb);
impc = impulseResponse(src,recc);

audiowrite('impa.wav',impa,fs);
audiowrite('impb.wav',impb,fs);
audiowrite('impc.wav',impc,fs);


% input('0');
% close('all');
% exit(0);
